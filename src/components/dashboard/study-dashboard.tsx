"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStudyStats } from "@/lib/stats";
import { dashboardRegime } from "@/lib/stats/regime";
import { StudyStats } from "@/types/stats";

import { CollectionTile, EmptyDashboard, NextReviewTile } from "./tiles";

interface StudyDashboardProps {
  /** Cards graded in the session that just ended; 0 on a cold landing. */
  reviewed: number;
  /** Re-runs the session fetch, in case something has fallen due since. */
  onCheckAgain?: () => void;
}

/**
 * The Study tab's idle state: what you see when nothing is due.
 *
 * **This is a client component on purpose.** The obvious alternative — a server
 * component passed as a child of `StudySession` — is worse on three counts.
 * `/dashboard` opens into a *session* whenever anything is due, which is most
 * visits, and a server child is rendered eagerly, so every one of those visits
 * would pay for three aggregate queries whose output is never shown. The numbers
 * also change *during* the session that precedes this screen, so a payload
 * rendered at page load would already be stale by the time it is displayed. And
 * the time zone the forecast is bucketed by is only knowable in the browser.
 *
 * One fetch, fired when the queue empties, is correct by construction. Please
 * don't "fix" this into a server component.
 */
export function StudyDashboard({
  reviewed,
  onCheckAgain,
}: StudyDashboardProps) {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats(await getStudyStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Effect-driven fetching, as in `StudySession`: the loading and result
    // states are set after an await. See that component's note.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return <LoadingPage message="Loading your stats..." />;
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
          <div>
            <h2 className="font-semibold">All caught up</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your stats couldn&apos;t be loaded, but there is nothing due right
              now.
            </p>
          </div>
          <Button variant="outline" onClick={() => void fetchStats()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const regime = dashboardRegime(stats);

  if (regime === "empty") {
    return <EmptyDashboard />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NextReviewTile
          reviewed={reviewed}
          nextDue={stats.collection.nextDue}
          forecast={stats.forecast}
        />
        <CollectionTile
          collection={stats.collection}
          // Suppressed in the `fresh` regime: a rate over an empty window would
          // render as a number where there is no measurement.
          retention={regime === "full" ? stats.retention : undefined}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/*
          Review history hangs off `flashcard_study`, which the
          `handle_deck_study_deletion` trigger removes when a user unsubscribes
          from a deck. So these numbers can legitimately shrink, and every one of
          them is labelled with its window rather than claimed as a lifetime
          total. This sentence is the only place that is said out loud.
        */}
        <p className="text-xs text-muted-foreground">
          Activity covers the decks you currently study. Unsubscribing from a
          deck removes its review history.
        </p>
        {onCheckAgain && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start sm:self-auto"
            onClick={onCheckAgain}
          >
            <RefreshCw aria-hidden="true" />
            Check again
          </Button>
        )}
      </div>
    </div>
  );
}
