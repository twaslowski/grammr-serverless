/**
 * Calendar-day arithmetic on `YYYY-MM-DD` strings.
 *
 * Every timestamp in this database is naive UTC wall-clock: Drizzle writes
 * `Date.toISOString()` and Postgres discards the `Z` on a `timestamp` column,
 * and postgres-js reads it back through `new Date(literal)`, which Node
 * interprets as *local* time. Production runs `TZ=UTC` so it round-trips; a
 * development box on `Europe/Berlin` skews silently.
 *
 * The defence is to bucket dates in SQL (`AT TIME ZONE`) and move them as
 * strings. These helpers therefore never construct a local `Date`: they parse
 * with `Date.UTC`, which is unambiguous and has no DST. The strings are already
 * local to the user, so treating them as UTC purely for *differencing* is
 * correct — and it is the whole reason the buckets are strings.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` → epoch millis at UTC midnight. NaN if unparseable. */
export function parseDay(day: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return NaN;

  const [, year, month, date] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(date));
}

/** Epoch millis → `YYYY-MM-DD`, read in UTC. */
export function toDay(millis: number): string {
  return new Date(millis).toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` shifted by whole days. */
export function addDays(day: string, days: number): string {
  return toDay(parseDay(day) + days * MS_PER_DAY);
}

/**
 * The calendar date `instant` falls on in `timeZone`, as `YYYY-MM-DD`.
 *
 * Built from `formatToParts` rather than a locale that happens to render
 * ISO-like output (`en-CA`), because that is a property of the locale data and
 * not a guarantee.
 */
export function localDay(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${find("year")}-${find("month")}-${find("day")}`;
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * The single-letter weekday label for a day string, for chart axes.
 *
 * Ambiguous by design — Tuesday and Thursday both read "T", as do Saturday and
 * Sunday. That is the accepted convention for a seven-column axis, and the
 * accessible name on the chart spells the days out in full.
 */
export function weekdayInitial(day: string): string {
  return WEEKDAY_INITIALS[new Date(parseDay(day)).getUTCDay()];
}

/** The full weekday name, for accessible labels and tooltips. */
export function weekdayName(day: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(parseDay(day)));
}
