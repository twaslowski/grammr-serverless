# The Study tab's idle dashboard

## Overview

`0319e24` replaced the seven-tile home screen with a four-tab bar and made
`/dashboard` open straight into a study session. That was right for the case
where cards are due, and left nothing for the case where they aren't: you landed
on `StudyComplete`, a hero card whose primary button read "Back to Dashboard" and
linked to `/dashboard` — the page it was already rendered on. `study-due-cards.tsx`,
the deleted home screen's stat widget, was still exported and rendered nowhere.

So there was no surface answering *when do I come back* or *how is this going*.
This adds one as the Study tab's **idle state**, not a fifth tab: when cards are
due, `/dashboard` behaves exactly as before; when nothing is due, or immediately
after a session ends, the same screen shows the dashboard.

Two tiles, both from data that already existed. **No migration.**

| Tile | Answers |
|---|---|
| `NextReviewTile` | When the next card comes back, and the next seven days' load |
| `CollectionTile` | How many cards, how they're distributed across FSRS states, 30-day retention |

## Architecture

### The tiles that were considered and left out

A streak with an activity heatmap, a word of the day, and a leeches tile were all
designed and then cut. The streak is the consequential omission: **dropping it is
what kept this small.** With no local-day streak arithmetic there is no need for a
366-day daily-bucket array in the payload, no `computeStreaks` module, and above
all no `profiles.timezone` column. Retention collapsed into one aggregate query.

If a streak is ever added back, the one rule that matters: *a day you have not
studied yet must not break the streak.* Counting back from today when today has no
reviews makes every user read 0 every morning, which is the single most
demoralising bug the tile can have. Count back from yesterday in that case.

For a word of the day, the source should be a **static seed list** of common
Russian lemmas resolved through `src/lib/dictionary-lookup.ts`, on its own lazily
fetched endpoint so a cold Lambda can never delay the numbers. Not `lexeme_cache`:
it is documented as safe to truncate, so yesterday's word could change identity,
and its contents are whatever anyone happened to look up.

### Time zone: a request parameter, not a column

The forecast buckets `due` into local calendar days and labels them by weekday.
Bucketing in UTC misfiles a card due at 00:30 Berlin as the previous day — a
visibly wrong label on the tile that is the point of the screen. This was
**observed, not theorised**: a card due 22:30 UTC buckets to Sep 1 under `tz=UTC`
and Sep 2 under `tz=Europe/Berlin`.

`profiles.timezone` was rejected. The only server-side hook that runs on every
dashboard render is `ensureProfile`, whose contract is `onConflictDoNothing`,
never upsert — an upsert there would reset every user's language pair on every
page view (see `russian-only-redesign.md`). A timezone write means either breaking
that contract or adding a second write path: more machinery than a query
parameter, and stale the moment the user travels.

`isValidTimeZone` in the route's `schema.ts` is therefore a **security control**,
not a nicety: the value lands inside an `AT TIME ZONE` expression. An absent `tz`
defaults to UTC; an explicitly invalid one is a 400 rather than a silent fallback,
because a caller that thinks it asked for Berlin should not be handed
plausible-looking UTC buckets.

### Client component, one fetch

`StudyDashboard` is a client component that fires exactly one request. The
obvious alternative — a server component passed as a child of `StudySession` —
loses on three counts:

1. `/dashboard` opens into a *session* whenever anything is due, which is most
   visits. A server child renders eagerly, so every one of those visits pays for
   three aggregate queries whose output is never shown.
2. The numbers change *during* the session that precedes this screen, so a
   payload rendered at page load is stale by the time it is displayed.
3. The time zone is only knowable in the browser.

One fetch, fired when the queue empties, is correct by construction. There is a
comment on the component saying so, because "Server Components first" in
`AGENTS.md` otherwise invites a well-meaning regression.

### Three statements, all indexed

`getStudyStats` in `src/lib/server/stats.ts` runs three queries in one
`Promise.all`:

- **Collection** — `count(*) FILTER` over the four states plus `due <= now`, and
  `min(due)` for the next review, in one scan of `idx_flashcard_study_user_state`.
- **Forecast** — `GROUP BY` local day over `idx_flashcard_study_due`, which is
  `(user_id, due) WHERE state <> 'New'` — exactly this predicate. Bounded by
  `interval '8 days'` rather than seven, because the UTC/local offset can push the
  seventh local day outside a seven-day UTC window; `fillForecast` trims it.
- **Retention** — two adjacent 30-day windows in one pass over `review_log`.

**Authorization** is manual, as everywhere in this app: the pooled connection
bypasses RLS, so the `pgPolicy` on `review_log` does not run. `review_log` carries
no `user_id`, so it is only attributable by joining through `flashcard_study`.
That join *is* the authorization, and the e2e suite asserts it counts a review
correctly rather than trusting it.

### Two SQL traps, both hit during implementation

Recorded because both cost a debugging cycle and both will recur:

1. **postgres-js cannot bind a `Date` inside a raw `sql` fragment.** It throws
   `ERR_INVALID_ARG_TYPE`, because only Drizzle's query builder applies the
   column's `mapToDriverValue`. `count(*) FILTER (...)` has no builder equivalent,
   so the comparison has nowhere else to live — hence the `at()` helper, which
   passes the ISO string and casts. Use builder helpers (`gt`, `lte`) wherever one
   exists.
2. **`GROUP BY` cannot repeat an expression containing a bind parameter.** Writing
   the `AT TIME ZONE` projection out twice yields `$1` in the select list and `$6`
   in the `GROUP BY`; Postgres matches them syntactically, sees two different
   placeholders and rejects the column as ungrouped (42803) even though both bind
   the same value. Group by **ordinal** (`GROUP BY 1`).

Related, and the reason `next_due` is formatted with `to_char` in SQL: every
timestamp in this database is naive UTC wall-clock (Drizzle writes
`toISOString()`, Postgres drops the `Z`), and postgres-js reads it back through
`new Date(literal)`, which Node interprets as *local* time. Production runs
`TZ=UTC` so it round-trips; a dev box on `Europe/Berlin` skews silently. **Bucket
dates in SQL and move them as strings.** `src/lib/stats/day.ts` never constructs a
local `Date`.

### Empty states decided centrally

`dashboardRegime` in `src/lib/stats/regime.ts` returns `empty | fresh | full`, so
the tiles carry no defensive branches and the rule is inspectable in one place:

- `empty` (no cards) → `EmptyDashboard` alone. Every tile is a statement about a
  collection, so an empty one would render as a wall of zeros that reads "broken"
  rather than "you haven't started".
- `fresh` (cards, no reviews) → both tiles, retention suppressed.
- `full` → everything.

Relatedly, `retention.rate` and `previousRate` are **nullable, never 0-on-empty**.
"0% retention" reads as catastrophic failure, and a delta against an empty prior
window would render a first month at 91% as "+91", which reads as improvement
rather than as the absence of a comparison. Absent and zero are different facts,
so the wire schema keeps them different.

### Charts

Hand-rolled divs; no charting library was added. Both were validated for
colour-vision separation — worst adjacent pair ΔE 9.1 (protan, light) and 10.7
(dark), against a floor of 8.

Two palette checks **do not pass and cannot be fixed from here**: in light mode
`--chart-3` is nearly achromatic and `--chart-4` sits at 1.6:1 against the card
surface. That is a property of the theme's tokens, not of the slot assignment, and
redefining `--chart-*` is a theme change. The required mitigation is in place: the
`StateBar` legend labels every state with its count, so no segment is identified
by colour alone and a segment too faint to see still has a readable number.

Two conventions worth keeping:

- `chart-1..5` are a **categorical** palette — unrelated hues in both themes. The
  state bar is the correct use. Never use them as an intensity ramp.
- Semantic colours must not collide with them. `chart-2` means "Learning" in the
  bar, so the success tick and the positive retention delta use
  `text-green-600 dark:text-green-400` — one hue cannot mean two things on one
  screen.

### `?dashboard=1`

`/dashboard?dashboard=1` opens straight onto the idle view. Without it, a UI test
of the idle state is inherently flaky: the shared per-language e2e user
accumulates cards across runs, so "review everything down to empty" is unbounded
and `/dashboard` opens into a session instead. It is not a test-only backdoor — it
reads data the caller already owns and changes nothing.

## Implementation

New: `src/types/stats.ts` (wire schema), `src/lib/stats/{day,forecast,retention,regime}.ts`
(pure, no I/O), `src/lib/server/stats.ts`, `src/app/api/v1/study/stats/{route,schema}.ts`,
`src/lib/stats.ts` (client fetcher), `src/components/dashboard/study-dashboard.tsx`
and `src/components/dashboard/tiles/*`.

`src/lib/interval.ts` is extracted from `src/lib/fsrs.ts`: `NextReviewTile` renders
"in 4 hours" with the same `formatInterval` that labels the four rating buttons, so
the idle screen speaks in the units the user just chose from. It had to move because
`fsrs.ts` has a top-level `import from "ts-fsrs"` and that package declares no
`sideEffects: false`, so importing the formatter from there would have shipped the
whole scheduler to the browser for the sake of a string. `fsrs.ts` re-exports both
functions, so existing importers are untouched.

Deleted, with the reasoning that each was superseded rather than merely moved:

| Deleted | Why |
|---|---|
| `study-complete.tsx` | Its one real message — how many cards you just did — is now the `NextReviewTile` headline. That removes the dead "Back to Dashboard" link by deletion rather than repair. Its other two buttons did not survive scrutiny: "Edit Flashcards" duplicated a tab, and "Study more" refetched a queue the server had just reported empty (now a low-key "Check again", which is the only thing a refetch can usefully turn up). |
| `study-due-cards.tsx` | Orphaned since `0319e24`. Its `<Link href="/dashboard">` wrapped a card only ever shown *on* `/dashboard`. |
| `GET /api/v1/study/due` + `getDueCardsCount` + `DueCardsCountSchema` | The widget above was the only consumer. Deleted in the same change as `/stats`, because leaving a second, weaker due-count endpoint behind guarantees someone builds against it. |
| `include_new` on the batch query schema | Only `/due` read it; `DueCardsQuerySchema` is now `StudyBatchQuerySchema`. |

Two fixes to existing code that this work walked into:

- `GET /api/v1/study` computed `remaining` by selecting **whole rows twice** and
  taking `.length` — two full row fetches to produce two integers. It now shares
  `countDueAndNew`.
- `src/components/ui/button.tsx` hardcoded `role="button"`. Redundant on a real
  `<button>`, and under `asChild` it overrode the slotted element's implicit role
   — so every `<Button asChild><Link/></Button>` in the app announced a navigation
  control as a button. Removed.

## Testing

`pnpm lint && pnpm typecheck && pnpm test` — 313 unit tests. Jest does not type
check, so `pnpm typecheck` is not optional.

The pure layer carries the unit tests, including the cases that are easy to get
wrong: an empty retention window is `null` not `0`; an empty *prior* window yields
no delta; an all-zero forecast week has `peak === 0` and must not become a `NaN`
bar height; `addDays` crosses a European DST boundary correctly (the whole reason
`day.ts` parses with `Date.UTC`). `isValidTimeZone` is tested against
`UTC'; DROP TABLE review_log; --` because it guards an interpolated value.

`e2e/tests/dashboard.spec.ts` covers what Jest structurally cannot, since both
need a database: that the four state counts partition the total, that the forecast
is seven ascending contiguous local days, that a review is counted through the
`review_log → flashcard_study` join, that a bad `tz` is a 400, and — under
`mobile-ru` (Pixel 7) — that the hand-rolled charts do not overflow the viewport.

The three queries were additionally run against a seeded local database across
`UTC`, `Europe/Berlin` and `Asia/Tokyo`, which is how both SQL traps above and the
UTC/Berlin bucket difference were found. `task e2e` has **not** been run against a
live stack for this change.

## Future work

- **`review_log.user_id` + an index on `(user_id, review DESC)`.** Today the
  retention query nested-loops through `idx_review_log_flashcard_study_id`, which
  is fine at this scale. Revisit when a single user's `review_log` passes ~10⁵ rows
  or the endpoint's p95 passes ~150 ms.
- **Durable history.** `review_log` cascades from `flashcard_study`, which the
  `handle_deck_study_deletion` trigger deletes on deck unsubscribe. So these
  numbers can legitimately *shrink*, which is why every one is labelled with its
  window and why the footnote says so out loud. The real fix — `ON DELETE SET
  NULL`, a denormalised `user_id`, and a snapshot of the card front, since the
  flashcard is gone too — is a design problem of its own, and shares the migration
  above. Do them together or not at all.
- **`deck_study.last_studied_at` is dead**: written by nothing, read by nothing.
  Either write it in the review route and use it for a per-deck breakdown, or drop
  the column. Neither is the worst of the three.
- The review route still updates `flashcard_study` and inserts `review_log`
  outside a transaction, which `spec/repetition.md` asked for. Unchanged here, but
  the dashboard is what makes a torn write visible.
