/**
 * Retention is the share of reviews the user did *not* rate "Again" — the
 * fraction they actually recalled. The rate itself is computed in SQL; what is
 * left here is the arithmetic that has to stay honest about empty windows.
 */

/**
 * A rate from a pass count and a sample size, or `null` when the sample is
 * empty.
 *
 * Empty must not collapse to 0: "0% retention" reads as total failure, when the
 * truth is that there is nothing to report yet.
 */
export function rateOf(passed: number, total: number): number | null {
  return total === 0 ? null : passed / total;
}

/**
 * The change in retention between the two windows, in percentage *points*, or
 * `null` when either window is empty.
 *
 * Null on an empty prior window matters: measured against nothing, a first
 * month at 91% would otherwise render as "+91", which reads as improvement
 * rather than as the absence of a comparison.
 */
export function retentionDelta(
  rate: number | null,
  previousRate: number | null,
): number | null {
  if (rate === null || previousRate === null) return null;

  return Math.round((rate - previousRate) * 100);
}

/** A rate as a whole-percent string, or an em dash when there is no rate. */
export function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}
