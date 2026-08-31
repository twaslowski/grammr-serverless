"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { StudyDashboard } from "@/components/dashboard/study-dashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loadSession, submitReview } from "@/lib/study";
import { Rating, StudyCardItem } from "@/types/fsrs";

import { StudyCard } from "./study-card";
import { StudyProgress } from "./study-progress";

const BATCH_SIZE = 10;
const REFETCH_THRESHOLD = 3;

interface StudySessionProps {
  /**
   * Which face of the tab to open on. `"session"` is the default and the
   * behaviour the tab has always had; `"dashboard"` skips the queue fetch and
   * shows the idle view, which is what `/dashboard?dashboard=1` is for.
   */
  initialView?: "session" | "dashboard";
}

export function StudySession({ initialView = "session" }: StudySessionProps) {
  const [cardQueue, setCardQueue] = useState<StudyCardItem[]>([]);
  const [progress, setProgress] = useState({
    reviewed: 0,
    remaining: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(initialView === "session");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const hasMoreCardsRef = useRef(true); // Track if server has more cards

  const fetchCards = useCallback(async (isInitialLoad: boolean = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (isInitialLoad) {
      setIsLoading(true);
      hasMoreCardsRef.current = true; // Reset on initial load
    } else {
      setIsFetchingMore(true);
    }
    setError(null);

    try {
      const session = await loadSession(BATCH_SIZE);

      if (isInitialLoad) {
        setCardQueue(session.cards);
        // `reviewed` carries over rather than resetting to 0. It starts at 0 on
        // mount, so this only differs on a "Check again", where zeroing it would
        // retract the credit for cards the reader really did review in this
        // sitting -- the headline would drop from "Nice work, 12 reviewed" back
        // to "All caught up" as a reward for tapping refresh.
        setProgress((prev) => ({
          reviewed: prev.reviewed,
          remaining: session.sessionProgress.remaining,
          // `total` has to absorb the carried-over count too, or the progress
          // bar divides 12 reviewed by the 3 cards that have since fallen due
          // and renders 400%.
          total: prev.reviewed + session.sessionProgress.total,
        }));
        hasMoreCardsRef.current = session.cards.length > 0;
      } else {
        setCardQueue((prev) => {
          const existingIds = new Set(prev.map((item) => item.card.id));
          const newCards = session.cards.filter(
            (item) => !existingIds.has(item.card.id),
          );
          // If no new cards were added, stop trying to fetch more
          if (newCards.length === 0) {
            hasMoreCardsRef.current = false;
          }
          return [...prev, ...newCards];
        });
      }
    } catch (err) {
      console.log(err instanceof Error ? err.message : "Failed to load cards");
      if (isInitialLoad) {
        setError("Failed to load Flashcards");
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsFetchingMore(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (initialView === "dashboard") return;

    // Effect-driven data fetching: loading/result state is set after an await.
    // The real fix is to fetch on the server and pass the data in as props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCards(true);
  }, [fetchCards, initialView]);

  // Background fetch when queue is running low
  useEffect(() => {
    if (
      cardQueue.length <= REFETCH_THRESHOLD &&
      cardQueue.length > 0 &&
      !isFetchingMore &&
      !fetchingRef.current &&
      hasMoreCardsRef.current // Only fetch if server has more cards
    ) {
      void fetchCards(false);
    }
  }, [cardQueue.length, isFetchingMore, fetchCards]);

  const handleReview = async (rating: Rating) => {
    if (cardQueue.length === 0) return;

    const currentCard = cardQueue[0];
    setIsSubmitting(true);
    setError(null);

    try {
      await submitReview(currentCard.card.id, rating);

      // Remove the reviewed card from the queue
      setCardQueue((prev) => prev.slice(1));

      setProgress((prev) => ({
        reviewed: prev.reviewed + 1,
        remaining: Math.max(0, prev.remaining - 1),
        total: prev.total,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // "Check again" rather than "study more": when the queue empties the server
  // has told us there is nothing left, so the only thing a refetch can turn up
  // is a card that has fallen due since. The reviewed count is deliberately
  // kept — it is what the session just achieved, not a per-fetch counter.
  const handleCheckAgain = () => {
    void fetchCards(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading cards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="min-h-[150px] bg-red-200/80 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-center">
          <h3 className="font-semibold text-lg text-destructive/90 mb-2">
            Error Loading Flashcards
          </h3>
          <p className="text-sm text-destructive/70">{error}</p>
        </div>
        <Button onClick={() => fetchCards(true)}>Try again</Button>
      </Card>
    );
  }

  // Nothing due: the tab's idle face.
  if (cardQueue.length === 0) {
    return (
      <StudyDashboard
        reviewed={progress.reviewed}
        onCheckAgain={handleCheckAgain}
      />
    );
  }

  const currentItem = cardQueue[0];

  return (
    <div className="space-y-6">
      <StudyProgress
        reviewed={progress.reviewed}
        remaining={progress.remaining}
        total={progress.total}
      />
      <StudyCard
        card={currentItem.card}
        schedulingOptions={currentItem.schedulingOptions}
        onReview={handleReview}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
