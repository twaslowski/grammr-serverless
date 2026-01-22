"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StudyCard } from "./study-card";
import { StudyProgress } from "./study-progress";
import { StudyComplete } from "./study-complete";
import { loadSession, submitReview } from "@/lib/study";
import { CardWithFlashcard, SchedulingInfo, Rating } from "@/types/fsrs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function StudySession() {
  const [currentCard, setCurrentCard] = useState<CardWithFlashcard | null>(
    null,
  );
  const [schedulingOptions, setSchedulingOptions] = useState<SchedulingInfo[]>(
    [],
  );
  const [progress, setProgress] = useState({
    reviewed: 0,
    remaining: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advanceSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await loadSession();
      setCurrentCard(session.card);
      setSchedulingOptions(session.schedulingOptions);
      setProgress((prev) => ({
        reviewed: prev.reviewed,
        remaining: session.sessionProgress.remaining,
        total: prev.total || session.sessionProgress.total,
      }));
    } catch (err) {
      console.log(err instanceof Error ? err.message : "Failed to load card");
      setError("Failed to load Flashcards");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void advanceSession();
  }, [advanceSession]);

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
      await advanceSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudyMore = () => {
    setProgress({ reviewed: 0, remaining: 0, total: 0 });
    void advanceSession();
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
        <Button onClick={advanceSession}>Try again</Button>
      </Card>
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
