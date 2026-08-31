import { z } from "zod";

/**
 * Wire shape of `GET /api/v1/study/stats`.
 *
 * Deliberately *not* covered by `src/types/test/schema-parity.test.ts`: unlike
 * the other schemas here it describes no table, only an aggregation. The parity
 * test's existence otherwise invites the reading that this one was forgotten.
 *
 * Like every schema in `src/types`, this is hand-written Zod with no
 * `@/db/schemas/*` import — those drag `drizzle-orm/pg-core` and the RLS policy
 * SQL into the browser bundle.
 */

/** One local calendar day's worth of upcoming reviews. */
export const ForecastDaySchema = z.object({
  /** `YYYY-MM-DD`, local to the requested time zone. A string, never a Date. */
  day: z.string(),
  count: z.number().int(),
});
export type ForecastDay = z.infer<typeof ForecastDaySchema>;

/**
 * How the collection is distributed across FSRS states, plus when the next
 * card comes back.
 */
export const CollectionStatsSchema = z.object({
  total: z.number().int(),
  new: z.number().int(),
  learning: z.number().int(),
  review: z.number().int(),
  relearning: z.number().int(),
  dueNow: z.number().int(),
  /** ISO instant with an explicit `Z`, or null when nothing is scheduled. */
  nextDue: z.string().nullable(),
});
export type CollectionStats = z.infer<typeof CollectionStatsSchema>;

/**
 * Recall performance over the last 30 days, with the preceding 30 for a delta.
 *
 * `rate` and `previousRate` are nullable rather than 0-on-empty: "0% retention"
 * reads as catastrophic failure, and a delta measured against an empty window
 * would read as a triumph. Absent and zero are different facts, so the schema
 * keeps them different.
 */
export const RetentionStatsSchema = z.object({
  /** 0..1 over the last 30 days; null when the window holds no reviews. */
  rate: z.number().nullable(),
  /** 0..1 over the 30 days before that; null when that window is empty. */
  previousRate: z.number().nullable(),
  /** Reviews in the current window — the sample the rate is drawn from. */
  reviews: z.number().int(),
  again: z.number().int(),
  hard: z.number().int(),
  good: z.number().int(),
  easy: z.number().int(),
});
export type RetentionStats = z.infer<typeof RetentionStatsSchema>;

export const StudyStatsSchema = z.object({
  /** Echoed back, so the payload explains its own day boundaries. */
  timeZone: z.string(),
  collection: CollectionStatsSchema,
  /** Ascending, gap-filled to exactly seven days by `fillForecast`. */
  forecast: z.array(ForecastDaySchema),
  retention: RetentionStatsSchema,
});
export type StudyStats = z.infer<typeof StudyStatsSchema>;
