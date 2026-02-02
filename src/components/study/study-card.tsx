"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardWithFlashcard, SchedulingInfo, Rating } from "@/types/fsrs";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { InflectionsDialog } from "@/components/inflection";
import {
  AnalysisFlashcardBack,
  FlashcardBack,
  ParadigmFlashcardBack,
  PhraseFlashcardBack,
} from "@/types/flashcards";
import { Analysis } from "@/components/flashcard/analysis";

interface StudyCardProps {
  card: CardWithFlashcard;
  schedulingOptions: SchedulingInfo[];
  onReview: (rating: Rating) => Promise<void>;
  isSubmitting: boolean;
}

const RATING_COLORS: Record<Rating, string> = {
  Again: "bg-red-500 hover:bg-red-600",
  Hard: "bg-orange-500 hover:bg-orange-600",
  Good: "bg-green-500 hover:bg-green-600",
  Easy: "bg-blue-500 hover:bg-blue-600",
};

const RATING_LABELS: Record<Rating, string> = {
  Again: "Again",
  Hard: "Hard",
  Good: "Good",
  Easy: "Easy",
};

interface FlashcardBackProps {
  back: FlashcardBack;
  notes?: string | null;
}

function FlashcardBackComponent({ back, notes }: FlashcardBackProps) {
  switch (back.type) {
    case "analysis":
      const analysisBack = back as AnalysisFlashcardBack;
      return (
        <div className="space-y-4">
          <Analysis analysis={analysisBack} />
          <p className="text-xl text-primary/80">{back.translation}</p>
          {notes && (
            <p className="text-sm text-muted-foreground italic">{notes}</p>
          )}
        </div>
      );
    case "word":
      const paradigmBack = back as ParadigmFlashcardBack;
      return (
        <InflectionsDialog
          paradigm={paradigmBack.paradigm}
          displayHeader={true}
          displayAddToFlashcards={false}
          trigger={
            <p className="text-3xl font-bold bg-primary/10 text-primary cursor-pointer">
              {paradigmBack.translation}
            </p>
          }
        />
      );
    case "phrase":
      const phraseBack = back as PhraseFlashcardBack;
      return (
        <div className="space-y-4">
          <p className="text-3xl font-bold text-primary">
            {phraseBack.translation}
          </p>
          {notes && (
            <p className="text-sm text-muted-foreground italic">{notes}</p>
          )}
        </div>
      );
    default:
      return null;
  }
}

export function StudyCard({
  card,
  schedulingOptions,
  onReview,
  isSubmitting,
}: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleRating = async (rating: Rating) => {
    await onReview(rating);
    setIsFlipped(false); // Reset for next card
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className="min-h-[300px] flex flex-col">
        <CardHeader className="flex-1 flex items-center justify-center text-center">
          {!isFlipped ? (
            // Front of card - show the word/phrase
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">{card.flashcard.front}</h2>
              <Button onClick={handleFlip} size="lg" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Show Answer
              </Button>
            </div>
          ) : (
            // Back of card - show the translation/analysis/word/phrase
            <FlashcardBackComponent
              back={card.flashcard.back}
              notes={card.flashcard.notes}
            />
          )}
        </CardHeader>

        {isFlipped && (
          <CardContent className="border-t pt-4">
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                How well did you remember?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {schedulingOptions.map((option) => (
                  <Button
                    key={option.rating}
                    onClick={() => handleRating(option.rating)}
                    disabled={isSubmitting}
                    className={cn(
                      "flex flex-col h-auto py-3",
                      RATING_COLORS[option.rating],
                    )}
                  >
                    <span className="font-semibold">
                      {RATING_LABELS[option.rating]}
                    </span>
                    <span className="text-xs opacity-80">
                      {option.nextReviewInterval}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Card state info */}
      <div className="mt-4 flex justify-center gap-4 text-sm text-muted-foreground">
        <span>
          State: <span className="font-medium">{card.state}</span>
        </span>
        <span>
          Reviews: <span className="font-medium">{card.reps}</span>
        </span>
        {card.lapses > 0 && (
          <span>
            Lapses: <span className="font-medium">{card.lapses}</span>
          </span>
        )}
      </div>
    </div>
  );
}
