import { weekdayInitial, weekdayName } from "@/lib/stats/day";
import { forecastPeak } from "@/lib/stats/forecast";
import { cn } from "@/lib/utils";
import { ForecastDay } from "@/types/stats";

interface ForecastChartProps {
  /** Exactly seven contiguous days, today first. See `fillForecast`. */
  forecast: ForecastDay[];
}

const TRACK_HEIGHT_PX = 72;
/** A zero day still gets a baseline tick, so the axis reads as continuous. */
const MIN_BAR_HEIGHT_PX = 2;

function describe(forecast: ForecastDay[]): string {
  const scheduled = forecast.filter(({ count }) => count > 0);
  if (scheduled.length === 0) {
    return "No reviews scheduled in the next seven days.";
  }

  return `Reviews due: ${scheduled
    .map(({ day, count }) => `${count} on ${weekdayName(day)}`)
    .join(", ")}.`;
}

/**
 * Seven columns of upcoming review load, built from divs.
 *
 * Hand-rolled rather than pulled from a charting library: this is the only
 * chart in the app, and `study-progress.tsx` already establishes that a bar
 * here is a `bg-muted` track with a coloured fill.
 *
 * The bars are invisible to a screen reader, so the whole figure carries one
 * `aria-label` that says the same thing in words. Per-bar tooltips are
 * deliberately absent — a 44px tap target that opens a hover tooltip is a
 * fight you lose on a phone, and `title` covers the desktop case.
 */
export function ForecastChart({ forecast }: ForecastChartProps) {
  const peak = forecastPeak(forecast);

  return (
    <div role="img" aria-label={describe(forecast)}>
      <div
        className="flex items-end justify-between gap-1"
        style={{ height: TRACK_HEIGHT_PX }}
        aria-hidden="true"
      >
        {forecast.map(({ day, count }, index) => (
          <div
            key={day}
            className="flex flex-1 flex-col items-center justify-end gap-1"
            title={`${weekdayName(day)}: ${count} due`}
          >
            <span className="text-[10px] leading-none text-muted-foreground tabular-nums">
              {count > 0 ? count : ""}
            </span>
            <div
              className={cn(
                "w-full rounded-t transition-all duration-300 ease-out",
                // Today is the bar the reader is standing on, so it gets the
                // accent; the rest are one flat categorical colour.
                index === 0 ? "bg-primary" : "bg-chart-1",
              )}
              style={{
                // `peak` is 0 for a user with nothing scheduled — the common
                // case for a new account — so it can never be a divisor.
                height:
                  peak === 0
                    ? MIN_BAR_HEIGHT_PX
                    : Math.max(
                        MIN_BAR_HEIGHT_PX,
                        (count / peak) * (TRACK_HEIGHT_PX - 14),
                      ),
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-1" aria-hidden="true">
        {forecast.map(({ day }, index) => (
          <span
            key={day}
            className={cn(
              "flex-1 text-center text-[10px] leading-none",
              index === 0
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            {weekdayInitial(day)}
          </span>
        ))}
      </div>
    </div>
  );
}
