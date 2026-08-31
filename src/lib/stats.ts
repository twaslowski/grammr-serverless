import { createValidatedFetcher } from "@/lib/api/validated-fetcher";
import { StudyStats, StudyStatsSchema } from "@/types/stats";

const STATS_URL = "/api/v1/study/stats";

const fetchStats = createValidatedFetcher(StudyStatsSchema);

/**
 * The browser's IANA time zone, for bucketing the forecast into local days.
 *
 * Resolves to `"UTC"` in an environment without `Intl` time-zone data, which is
 * also what the endpoint defaults to, so the two agree.
 */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** Fetch the dashboard aggregates for the signed-in user. */
export async function getStudyStats(
  timeZone: string = browserTimeZone(),
): Promise<StudyStats> {
  const params = new URLSearchParams({ tz: timeZone });

  return fetchStats(`${STATS_URL}?${params}`, { method: "GET" });
}
