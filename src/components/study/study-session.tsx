"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { StudyCard } from "./study-card";
import { StudyProgress } from "./study-progress";
import { StudyComplete } from "./study-complete";
import { loadSession, submitReview } from "@/lib/study";
import { StudyCardItem, Rating } from "@/types/fsrs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const BATCH_SIZE = 10;
const REFETCH_THRESHOLD = 3;

export function StudySession() {
  const [cardQueue, setCardQueue] = useState<StudyCardItem[]>([]);
  const [progress, setProgress] = useState({
    reviewed: 0,
    remaining: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
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
        setProgress({
          reviewed: 0,
          remaining: session.sessionProgress.remaining,
          total: session.sessionProgress.total,
        });
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
    void fetchCards(true);
  }, [fetchCards]);

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

  const handleStudyMore = () => {
    setProgress({ reviewed: 0, remaining: 0, total: 0 });
    setCardQueue([]);
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
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => fetchCards(true)}>Try again</Button>
      </Card>
    );
  }

  // No more cards to study
  if (cardQueue.length === 0) {
    return (
      <StudyComplete
        reviewed={progress.reviewed}
        onStudyMore={handleStudyMore}
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
