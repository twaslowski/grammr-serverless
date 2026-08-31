import { ForecastDay } from "@/types/stats";

import { addDays } from "./day";

/** How many days the forecast covers, today included. */
export const FORECAST_DAYS = 7;

/**
 * Gap-fill sparse day buckets into a contiguous run starting at `today`.
 *
 * The query bounds `due` by `interval '8 days'` rather than seven, because the
 * offset between UTC and the user's zone can push the seventh local day past a
 * seven-day UTC window. This trims that slack back down and inserts zeros for
 * days with nothing scheduled, so the chart always has exactly `days` columns
 * and never has to reason about missing data.
 */
export function fillForecast(
  buckets: ForecastDay[],
  today: string,
  days: number = FORECAST_DAYS,
): ForecastDay[] {
  const counts = new Map(buckets.map(({ day, count }) => [day, count]));

  return Array.from({ length: days }, (_, offset) => {
    const day = offset === 0 ? today : addDays(today, offset);
    return { day, count: counts.get(day) ?? 0 };
  });
}

/**
 * The tallest column, or 0 when nothing is scheduled.
 *
 * Exposed separately so the chart never divides by it without checking: an
 * all-zero week is the common case for a new user, and `n / 0` renders as a
 * `NaN%` height, which browsers drop silently.
 */
export function forecastPeak(forecast: ForecastDay[]): number {
  return forecast.reduce((peak, { count }) => Math.max(peak, count), 0);
}
