/**
 * Human-readable interval formatting.
 *
 * Split out of `@/lib/fsrs` so that client components can render an interval
 * without importing `ts-fsrs`. `fsrs.ts` has a top-level `import ... from
 * "ts-fsrs"`, and that package declares no `sideEffects: false`, so a bundler
 * cannot be relied on to drop it — importing `formatInterval` from there ships
 * the whole scheduler to the browser for the sake of a string. This module has
 * no dependencies at all.
 *
 * `fsrs.ts` re-exports both functions, so existing importers are unaffected.
 */

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;
const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

/** Round to at most one decimal so long intervals keep some resolution */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Format an interval expressed in (possibly fractional) days as a
 * human-readable string.
 *
 * Note this must be given the real interval, not a card's `scheduled_days`:
 * FSRS reports `scheduled_days === 0` for every intra-day learning and
 * relearning step, so formatting that field collapses 1m/6m/10m into "1 minute".
 */
export function formatInterval(days: number): string {
  const minutes = Math.round(days * 24 * 60);
  if (minutes < 60) {
    return pluralize(Math.max(1, minutes), "minute");
  }

  const hours = Math.round(days * 24);
  if (hours < 24) {
    return pluralize(hours, "hour");
  }

  if (days < 30) {
    return pluralize(Math.round(days), "day");
  }

  if (days < 365) {
    return pluralize(round1(days / DAYS_PER_MONTH), "month");
  }

  return pluralize(round1(days / DAYS_PER_YEAR), "year");
}

/**
 * The interval, in fractional days, between `now` and when the card falls due.
 */
export function intervalInDays(due: Date, now: Date): number {
  return Math.max(0, (due.getTime() - now.getTime()) / MS_PER_DAY);
}
