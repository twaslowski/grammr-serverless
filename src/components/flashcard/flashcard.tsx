"use client";

import React from "react";
import { Trash2 } from "lucide-react";

import { Analysis } from "@/components/flashcard/analysis";
import { cardDetail } from "@/components/flashcard/card-detail";
import { CardDisclosure } from "@/components/flashcard/card-disclosure";
import { UpdateFlashcardDialog } from "@/components/flashcard/update-flashcard-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLexemeLabel } from "@/lib/feature-labels";
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

  // Gender is a property of the lexeme, so it appears nowhere in the table of
  // forms behind the disclosure — and the table's own header, which is where
  // it is normally stated, is suppressed here. Without this line there is no
  // way to tell a masculine noun from a feminine one anywhere in the list.
  const lexeme =
    flashcard.back.type === "word"
      ? getLexemeLabel(
          flashcard.back.paradigm.partOfSpeech,
          flashcard.back.paradigm.lemmaFeatures,
        )
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg">{flashcardFront}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {flashcard.back.translation}
            </p>
            {lexeme && (
              <p className="text-xs text-muted-foreground">{lexeme}</p>
            )}
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
