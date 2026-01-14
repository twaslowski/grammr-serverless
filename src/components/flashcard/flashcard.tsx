"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp, Table2 } from "lucide-react";
import { FlashcardWithDeck } from "@/types/flashcards";

interface FlashcardProps {
  flashcard: FlashcardWithDeck;
  onDelete: (id: number) => void;
}

export function Flashcard({ flashcard, onDelete }: FlashcardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasInflections =
    flashcard.back.inflections && flashcard.back.inflections.length > 0;

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

        {hasInflections && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="gap-1 -ml-2"
            >
              <Table2 className="h-4 w-4" />
              {isExpanded ? "Hide" : "Show"} Inflections (
              {flashcard.back.inflections!.length})
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {flashcard.back
                    .inflections!.slice(0, 10)
                    .map((inflection, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {inflection.features.map((f) => f.value).join(", ")}:
                        </span>
                        <span className="font-medium">
                          {inflection.inflected}
                        </span>
                      </div>
                    ))}
                  {flashcard.back.inflections!.length > 10 && (
                    <div className="col-span-2 text-xs text-muted-foreground">
                      ... and {flashcard.back.inflections!.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
