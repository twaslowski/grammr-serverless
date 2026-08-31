"use client";

import React from "react";
import { Trash2 } from "lucide-react";

import { Analysis } from "@/components/flashcard/analysis";
import { cardDetail } from "@/components/flashcard/card-detail";
import { CardDisclosure } from "@/components/flashcard/card-disclosure";
import { UpdateFlashcardDialog } from "@/components/flashcard/update-flashcard-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashcardWithDeck } from "@/types/flashcards";

interface FlashcardProps {
  flashcard: FlashcardWithDeck;
  isOwner: boolean;
  onDelete: (id: number) => void;
  onUpdate: (updatedFlashcard: FlashcardWithDeck) => void;
}

export function Flashcard({
  flashcard,
  isOwner,
  onDelete,
  onUpdate,
}: FlashcardProps) {
  const flashcardFront =
    flashcard.back.type === "analysis" ? (
      <Analysis textStyle="text-lg" analysis={flashcard.back} />
    ) : (
      flashcard.front
    );

  // Whatever this card has behind it, reached the same way as every other
  // card's — rather than a button only paradigm cards got.
  const detail = cardDetail(flashcard.back);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg">{flashcardFront}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {flashcard.back.translation}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isOwner && (
              <>
                <UpdateFlashcardDialog
                  flashcard={flashcard}
                  onUpdate={onUpdate}
                />
                <Button
                  variant="ghost"
                  size="touch"
                  onClick={() => onDelete(flashcard.id)}
                  className="text-destructive hover:text-destructive"
                  title="Delete flashcard"
                  aria-label="Delete flashcard"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      {detail && (
        <CardContent className="pt-0">
          <CardDisclosure detail={detail} />
        </CardContent>
      )}
    </Card>
  );
}
