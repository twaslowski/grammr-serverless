import { CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatInterval, intervalInDays } from "@/lib/interval";
import { ForecastDay } from "@/types/stats";

import { ForecastChart } from "./forecast-chart";

interface NextReviewTileProps {
  /** Cards graded in the session that just ended, if any. */
  reviewed: number;
  /** ISO instant of the next scheduled review, or null when nothing is queued. */
  nextDue: string | null;
  forecast: ForecastDay[];
  /** Injectable for tests; the relative interval is computed against it. */
  now?: Date;
}

/**
 * "When do I come back" — the one question an idle study screen owes an answer
 * to, so it is the first thing on the page.
 *
 * This absorbed the old `StudyComplete` card. That component's primary button
 * said "Back to Dashboard" and linked to `/dashboard`, the page it was already
 * rendered on; folding its one real message — how many cards you just did —
 * into this headline removes the dead link rather than repairing it.
 */
export function NextReviewTile({
  reviewed,
  nextDue,
  forecast,
  now = new Date(),
}: NextReviewTileProps) {
  // `formatInterval` is the same function that labels the four rating buttons,
  // so "in 4 hours" here reads in the same units the user just chose from.
  const untilNext = nextDue
    ? formatInterval(intervalInDays(new Date(nextDue), now))
    : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-tight">
              {reviewed > 0
                ? `Nice work — ${reviewed} ${reviewed === 1 ? "card" : "cards"} reviewed`
                : "All caught up"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {untilNext
                ? `Next review in ${untilNext}.`
                : "Nothing scheduled yet."}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Coming up
          </h3>
          <ForecastChart forecast={forecast} />
        </div>
      </CardContent>
    </Card>
  );
}
