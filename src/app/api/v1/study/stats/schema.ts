import { z } from "zod";

/**
 * Whether `timeZone` is an IANA zone this runtime knows.
 *
 * This is a security control, not a nicety. The value reaches SQL inside an
 * `AT TIME ZONE` expression, so it is the guard on an interpolated string, and
 * it is unit-tested as such. Anything Postgres would have to interpret must be
 * rejected here first.
 */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Query params for the stats endpoint.
 *
 * The time zone is a request parameter rather than a stored preference: it is
 * only knowable in the browser, it changes when the user travels, and the one
 * server-side hook that runs on every dashboard render — `ensureProfile` — is
 * contractually forbidden from upserting. See `docs/agent/STUDY_DASHBOARD.md`.
 *
 * Defaults to UTC when absent, but an explicitly *wrong* value is a 400 rather
 * than a silent fallback: a caller that thinks it asked for `Europe/Berlin`
 * should not be handed UTC buckets that look plausible.
 */
export const StudyStatsQuerySchema = z.object({
  tz: z
    .string()
    .default("UTC")
    .refine(isValidTimeZone, "Unknown IANA time zone"),
});
