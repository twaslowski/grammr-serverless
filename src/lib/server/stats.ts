import { and, count, eq, gt, lte, ne, sql } from "drizzle-orm";

import { db } from "@/db/connect";
import { flashcardStudy, reviewLogs } from "@/db/schemas/schema";
import { localDay } from "@/lib/stats/day";
import { fillForecast } from "@/lib/stats/forecast";
import { rateOf } from "@/lib/stats/retention";
import { ForecastDay, StudyStats } from "@/types/stats";

/**
 * Aggregate queries behind the Study tab's idle dashboard.
 *
 * Server-only: imports `db`. Every read is scoped to the caller — the two
 * `flashcard_study` queries filter on `user_id` directly, and `review_log`,
 * which has no `user_id` of its own, is reached only by joining through
 * `flashcard_study`. That join is the authorization, not a convenience: the
 * pooled connection bypasses RLS, so the `pgPolicy` on `review_log` does not
 * run for application queries.
 */

const RETENTION_WINDOW_DAYS = 30;
/** Slack for the UTC/local offset; `fillForecast` trims it back to seven. */
const FORECAST_WINDOW_DAYS = 8;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * An instant, bound safely inside a raw `sql` fragment.
 *
 * postgres-js cannot bind a `Date`: it throws `ERR_INVALID_ARG_TYPE`, because
 * only Drizzle's query builder applies the column's `mapToDriverValue`, and a
 * raw fragment bypasses it. Passing the ISO string and casting is the same
 * round trip the builder performs — Postgres discards the `Z` on a `timestamp`
 * column, which is exactly how every timestamp in this database was written.
 *
 * Needed because `count(*) FILTER (...)` has no builder equivalent, so these
 * comparisons have nowhere else to live.
 */
function at(instant: Date) {
  return sql`${instant.toISOString()}::timestamp`;
}

/**
 * Cards due now and cards never seen, in a single index scan.
 *
 * Exported because `GET /api/v1/study` needs the same two numbers for its
 * progress bar, and used to get them by selecting whole rows twice and taking
 * `.length` — two full row fetches to produce two integers.
 */
export async function countDueAndNew(
  userId: string,
  now: Date = new Date(),
): Promise<{ due: number; new: number }> {
  const [row] = await db
    .select({
      due: sql<number>`count(*) filter (
        where ${flashcardStudy.state} <> 'New' and ${flashcardStudy.due} <= ${at(now)}
      )`.mapWith(Number),
      new: sql<number>`count(*) filter (
        where ${flashcardStudy.state} = 'New'
      )`.mapWith(Number),
    })
    .from(flashcardStudy)
    .where(eq(flashcardStudy.userId, userId));

  return { due: row?.due ?? 0, new: row?.new ?? 0 };
}

/**
 * Q1 — the whole collection in one pass over `idx_flashcard_study_user_state`.
 *
 * `next_due` is formatted in SQL rather than returned as a timestamp: the
 * column is naive UTC, and letting postgres-js hand back a `Date` parsed from a
 * space-separated literal would reintroduce exactly the local-time skew that
 * `@/lib/stats/day` exists to avoid.
 */
async function selectCollection(userId: string, now: Date) {
  const [row] = await db
    .select({
      total: count(),
      new: sql<number>`count(*) filter (where ${flashcardStudy.state} = 'New')`.mapWith(
        Number,
      ),
      learning:
        sql<number>`count(*) filter (where ${flashcardStudy.state} = 'Learning')`.mapWith(
          Number,
        ),
      review:
        sql<number>`count(*) filter (where ${flashcardStudy.state} = 'Review')`.mapWith(
          Number,
        ),
      relearning:
        sql<number>`count(*) filter (where ${flashcardStudy.state} = 'Relearning')`.mapWith(
          Number,
        ),
      dueNow: sql<number>`count(*) filter (
        where ${flashcardStudy.state} <> 'New' and ${flashcardStudy.due} <= ${at(now)}
      )`.mapWith(Number),
      nextDue: sql<string | null>`to_char(
        min(${flashcardStudy.due}) filter (
          where ${flashcardStudy.state} <> 'New' and ${flashcardStudy.due} > ${at(now)}
        ),
        'YYYY-MM-DD"T"HH24:MI:SS"Z"'
      )`,
    })
    .from(flashcardStudy)
    .where(eq(flashcardStudy.userId, userId));

  return row;
}

/**
 * Q2 — upcoming review load per local calendar day.
 *
 * `idx_flashcard_study_due` is `(user_id, due) WHERE state <> 'New'`, which is
 * exactly this predicate. Returns at most eight rows.
 *
 * `timeZone` lands inside an `AT TIME ZONE` expression, so it must already have
 * been validated by `isValidTimeZone` — see the route's query schema.
 */
async function selectForecast(
  userId: string,
  now: Date,
  timeZone: string,
): Promise<ForecastDay[]> {
  const horizon = new Date(now.getTime() + FORECAST_WINDOW_DAYS * MS_PER_DAY);

  return (
    db
      .select({
        day: sql<string>`((${flashcardStudy.due} at time zone 'UTC') at time zone ${timeZone})::date::text`,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(flashcardStudy)
      .where(
        and(
          eq(flashcardStudy.userId, userId),
          ne(flashcardStudy.state, "New"),
          gt(flashcardStudy.due, now),
          lte(flashcardStudy.due, horizon),
        ),
      )
      // By ordinal, not by repeating the expression: `timeZone` is a bind
      // parameter, so a second copy of the projection is `$6` where the select
      // list has `$1`. Postgres matches GROUP BY to the select list
      // syntactically, sees two different placeholders, and rejects the column as
      // ungrouped (42803) even though both bind the same value.
      .groupBy(sql`1`)
      .orderBy(sql`1`)
  );
}

/**
 * Q3 — recall performance over two adjacent 30-day windows, in one pass.
 *
 * No day-bucketing here: a few hours of skew at a 30-day boundary changes
 * nothing a reader would notice, so this query needs no time zone.
 *
 * Plan: index scan on the user's `flashcard_study` rows, nested loop into
 * `idx_review_log_flashcard_study_id`, with `review >=` filtering the inner
 * side. There is no index on `review` and none is needed at this scale — see
 * `docs/agent/STUDY_DASHBOARD.md` for the threshold at which that changes.
 */
async function selectRetention(userId: string, now: Date) {
  const currentFrom = new Date(
    now.getTime() - RETENTION_WINDOW_DAYS * MS_PER_DAY,
  );
  const previousFrom = new Date(
    now.getTime() - 2 * RETENTION_WINDOW_DAYS * MS_PER_DAY,
  );

  const inCurrent = sql`${reviewLogs.review} >= ${at(currentFrom)}`;
  const inPrevious = sql`${reviewLogs.review} < ${at(currentFrom)}`;
  const recalled = sql`${reviewLogs.rating} <> 'Again'`;

  const [row] = await db
    .select({
      currentTotal: sql<number>`count(*) filter (where ${inCurrent})`.mapWith(
        Number,
      ),
      currentRecalled:
        sql<number>`count(*) filter (where ${inCurrent} and ${recalled})`.mapWith(
          Number,
        ),
      previousTotal: sql<number>`count(*) filter (where ${inPrevious})`.mapWith(
        Number,
      ),
      previousRecalled:
        sql<number>`count(*) filter (where ${inPrevious} and ${recalled})`.mapWith(
          Number,
        ),
      again:
        sql<number>`count(*) filter (where ${inCurrent} and ${reviewLogs.rating} = 'Again')`.mapWith(
          Number,
        ),
      hard: sql<number>`count(*) filter (where ${inCurrent} and ${reviewLogs.rating} = 'Hard')`.mapWith(
        Number,
      ),
      good: sql<number>`count(*) filter (where ${inCurrent} and ${reviewLogs.rating} = 'Good')`.mapWith(
        Number,
      ),
      easy: sql<number>`count(*) filter (where ${inCurrent} and ${reviewLogs.rating} = 'Easy')`.mapWith(
        Number,
      ),
    })
    .from(reviewLogs)
    .innerJoin(
      flashcardStudy,
      eq(reviewLogs.flashcardStudyId, flashcardStudy.id),
    )
    .where(
      and(
        eq(flashcardStudy.userId, userId),
        sql`${reviewLogs.review} >= ${at(previousFrom)}`,
      ),
    );

  return row;
}

/** Everything the dashboard needs, in three concurrent statements. */
export async function getStudyStats(
  userId: string,
  timeZone: string,
  now: Date = new Date(),
): Promise<StudyStats> {
  const [collection, forecast, retention] = await Promise.all([
    selectCollection(userId, now),
    selectForecast(userId, now, timeZone),
    selectRetention(userId, now),
  ]);

  return {
    timeZone,
    collection: {
      total: collection?.total ?? 0,
      new: collection?.new ?? 0,
      learning: collection?.learning ?? 0,
      review: collection?.review ?? 0,
      relearning: collection?.relearning ?? 0,
      dueNow: collection?.dueNow ?? 0,
      nextDue: collection?.nextDue ?? null,
    },
    forecast: fillForecast(forecast, localDay(now, timeZone)),
    retention: {
      rate: rateOf(
        retention?.currentRecalled ?? 0,
        retention?.currentTotal ?? 0,
      ),
      previousRate: rateOf(
        retention?.previousRecalled ?? 0,
        retention?.previousTotal ?? 0,
      ),
      reviews: retention?.currentTotal ?? 0,
      again: retention?.again ?? 0,
      hard: retention?.hard ?? 0,
      good: retention?.good ?? 0,
      easy: retention?.easy ?? 0,
    },
  };
}
