"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Table2 } from "lucide-react";
import { FlashcardWithDeck } from "@/types/flashcards";
import { InflectionsDialog } from "@/components/inflection";
import { UpdateFlashcardDialog } from "@/components/flashcard/update-flashcard-dialog";

interface FlashcardProps {
  flashcard: FlashcardWithDeck;
  onDelete: (id: number) => void;
  onUpdate?: (updatedFlashcard: FlashcardWithDeck) => void;
}

export function Flashcard({ flashcard, onDelete, onUpdate }: FlashcardProps) {
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
            <UpdateFlashcardDialog flashcard={flashcard} onUpdate={onUpdate} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(flashcard.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {flashcard.back.paradigm &&
          flashcard.back.paradigm.inflections.length > 0 && (
            <div className="mt-2">
              <InflectionsDialog
                paradigm={flashcard.back.paradigm}
                displayHeader={true}
                displayAddToFlashcards={false}
                trigger={
                  <Button variant="ghost" size="sm" className="gap-1 -ml-2">
                    <Table2 className="h-4 w-4" />
                    View Inflections (
                    {flashcard.back.paradigm.inflections.length})
                  </Button>
                }
              />
            </div>
          )}
      </CardContent>
    </Card>
  );
}
