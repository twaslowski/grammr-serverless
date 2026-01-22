"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StudyCard } from "./study-card";
import { StudyProgress } from "./study-progress";
import { StudyComplete } from "./study-complete";
import { getNextStudyCard, submitReview } from "@/lib/study";
import { CardWithFlashcard, SchedulingInfo, Rating } from "@/types/fsrs";
import { Loader2 } from "lucide-react";
import { ErrorField } from "@/components/ui/error";

interface StudySessionProps {
  initialCard?: CardWithFlashcard | null;
  initialSchedulingOptions?: SchedulingInfo[];
  initialProgress?: {
    reviewed: number;
    remaining: number;
    total: number;
  };
}

export function StudySession({
  initialCard,
  initialSchedulingOptions,
  initialProgress,
}: StudySessionProps) {
  const [currentCard, setCurrentCard] = useState<CardWithFlashcard | null>(
    initialCard || null,
  );
  const [schedulingOptions, setSchedulingOptions] = useState<SchedulingInfo[]>(
    initialSchedulingOptions || [],
  );
  const [progress, setProgress] = useState(
    initialProgress || { reviewed: 0, remaining: 0, total: 0 },
  );
  const [isLoading, setIsLoading] = useState(!initialCard);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNextCard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await getNextStudyCard();
      setCurrentCard(session.card);
      setSchedulingOptions(session.schedulingOptions);
      setProgress((prev) => ({
        reviewed: prev.reviewed,
        remaining: session.sessionProgress.remaining,
        total: prev.total || session.sessionProgress.total,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCard) {
      loadNextCard();
    }
  }, [initialCard, loadNextCard]);

  const handleReview = async (rating: Rating) => {
    if (!currentCard) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitReview(currentCard.id, rating);
      setProgress((prev) => ({
        reviewed: prev.reviewed + 1,
        remaining: Math.max(0, prev.remaining - 1),
        total: prev.total,
      }));
      // Load the next card
      await loadNextCard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudyMore = () => {
    setProgress({ reviewed: 0, remaining: 0, total: 0 });
    loadNextCard();
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
      <div className="text-center py-12">
        <ErrorField message={error} />
        <button onClick={loadNextCard} className="text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  // No more cards to study
  if (!currentCard) {
    return (
      <StudyComplete
        reviewed={progress.reviewed}
        onStudyMore={handleStudyMore}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StudyProgress
        reviewed={progress.reviewed}
        remaining={progress.remaining}
        total={progress.total}
      />
      <StudyCard
        card={currentCard}
        schedulingOptions={schedulingOptions}
        onReview={handleReview}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
