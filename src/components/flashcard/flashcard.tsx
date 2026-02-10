"use client";

import React from "react";
import { EyeIcon, EyeOff, Table2, Trash2 } from "lucide-react";

import { UpdateFlashcardDialog } from "@/components/flashcard/update-flashcard-dialog";
import { InflectionsDialog } from "@/components/inflection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashcardWithDeck } from "@/types/flashcards";

interface FlashcardProps {
  flashcard: FlashcardWithDeck;
  isOwner: boolean;
  onDelete: (id: number) => void;
  onStudy: (flashcard: FlashcardWithDeck) => void;
  onSuspend: (flashcard: FlashcardWithDeck) => void;
  onUpdate: (updatedFlashcard: FlashcardWithDeck) => void;
}

export function Flashcard({
  flashcard,
  isOwner,
  onDelete,
  onSuspend,
  onUpdate,
}: FlashcardProps) {
  const isStudying = !!flashcard.studyCard;

  // todo: currently, unsuspending a card is not supported. The API operations are simply not in place yet.
  const handleToggleStudying = () => {
    if (isStudying) {
      onSuspend(flashcard);
    } else {
      return;
      // onStartStudying(flashcard);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{flashcard.front}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {flashcard.back.translation}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!isStudying}
              onClick={handleToggleStudying}
              title={
                isStudying
                  ? "Suspend this flashcard"
                  : "Unsuspend this flashcard"
              }
            >
              {isStudying ? (
                <EyeIcon className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            {isOwner && (
              <>
                <UpdateFlashcardDialog
                  flashcard={flashcard}
                  onUpdate={onUpdate}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(flashcard.id)}
                  className="text-destructive hover:text-destructive"
                  title="Delete flashcard"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {flashcard.back.type === "word" && (
          <div className="mt-2">
            <InflectionsDialog
              paradigm={flashcard.back.paradigm}
              displayHeader={true}
              displayAddToFlashcards={false}
              trigger={
                <Button variant="ghost" size="sm" className="gap-1 -ml-2">
                  <Table2 className="h-4 w-4" />
                  View Inflections ({flashcard.back.paradigm.inflections.length}
                  )
                </Button>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
