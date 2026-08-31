import { Card, CardContent } from "@/components/ui/card";
import { formatRate, retentionDelta } from "@/lib/stats/retention";
import { cn } from "@/lib/utils";
import { CollectionStats, RetentionStats } from "@/types/stats";

import { StateBar } from "./state-bar";

interface CollectionTileProps {
  collection: CollectionStats;
  /** Omitted in the `fresh` regime, where a rate would misrepresent no data. */
  retention?: RetentionStats;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-xs text-muted-foreground">no change</span>;
  }

  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        // Not `chart-2`: that token means "Learning" in the bar directly above,
        // and one hue cannot mean two things on one screen.
        delta > 0 ? "text-green-600 dark:text-green-400" : "text-destructive",
      )}
    >
      {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} pt
      {Math.abs(delta) === 1 ? "" : "s"}
    </span>
  );
}

export function CollectionTile({ collection, retention }: CollectionTileProps) {
  const delta = retention
    ? retentionDelta(retention.rate, retention.previousRate)
    : null;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold leading-tight">
            {collection.total} {collection.total === 1 ? "card" : "cards"}
          </h2>
        </div>

        <StateBar collection={collection} />

        {retention && (
          <div className="border-t pt-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Retention (30 days)
              </h3>
              <span className="text-2xl font-semibold tabular-nums">
                {formatRate(retention.rate)}
              </span>
              {delta !== null && <DeltaBadge delta={delta} />}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
              Again {retention.again} · Hard {retention.hard} · Good{" "}
              {retention.good} · Easy {retention.easy}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
