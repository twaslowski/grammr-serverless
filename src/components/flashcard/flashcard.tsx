"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp, Table2 } from "lucide-react";
import { FlashcardWithDeck } from "@/types/flashcards";
import { InflectionsTable } from "@/components/inflection";

interface FlashcardProps {
  flashcard: FlashcardWithDeck;
  onDelete: (id: number) => void;
}

export function Flashcard({ flashcard, onDelete }: FlashcardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
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
              onClick={() => onDelete(flashcard.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {flashcard.notes && (
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">Notes:</span> {flashcard.notes}
          </p>
        )}

        {flashcard.back.paradigm &&
          flashcard.back.paradigm.inflections.length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="gap-1 -ml-2"
              >
                <Table2 className="h-4 w-4" />
                {isExpanded ? "Hide" : "Show"} Inflections (
                {flashcard.back.paradigm.inflections!.length})
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {isExpanded && (
                <div className="mt-2 p-3 rounded-md">
                  <InflectionsTable
                    paradigm={flashcard.back.paradigm}
                    displayAddFlashcard={false}
                  />
                </div>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
