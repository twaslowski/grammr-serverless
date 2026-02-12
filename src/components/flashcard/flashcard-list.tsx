"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useDebounce } from "use-debounce";

import { FlashcardListQuery } from "@/app/api/v1/flashcards/schema";
import { useProfile } from "@/components/dashboard/profile-provider";
import { DeckSelector } from "@/components/flashcard/deck-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteCardStudy,
  deleteFlashcard,
  getDecks,
  getFlashcards,
} from "@/lib/flashcards";
import { Deck } from "@/types/deck";
import { FlashcardWithDeck } from "@/types/flashcards";

import { Flashcard } from "./flashcard";

interface FlashcardListProps {
  initialFlashcards?: FlashcardWithDeck[];
}

export function FlashcardList({ initialFlashcards = [] }: FlashcardListProps) {
  const [flashcards, setFlashcards] =
    useState<FlashcardWithDeck[]>(initialFlashcards);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  const profile = useProfile();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  const fetchDecks = useCallback(async () => {
    try {
      const decks = await getDecks();
      setDecks(decks);
    } catch (err) {
      console.error("Failed to fetch decks:", err);
    }
  }, []);

  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query: FlashcardListQuery = {
        deckId: selectedDeck?.id,
        search: debouncedSearchQuery || undefined,
      };

      const data = await getFlashcards(query);
      setFlashcards(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch flashcards";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, selectedDeck]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) {
      return;
    }

    try {
      await deleteFlashcard(id);
      setFlashcards((prev) => prev.filter((f) => f.id !== id));
      toast.success("Flashcard deleted");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete flashcard";
      toast.error(message);
    }
  };

  const handleSuspendFlashcard = async (flashcard: FlashcardWithDeck) => {
    if (!confirm("Are you sure you want to suspend this flashcard?")) {
      return;
    }

    if (!flashcard.studyCard) {
      toast.error("This flashcard is already suspended");
      return;
    }

    try {
      await deleteCardStudy(flashcard.id);
      setFlashcards((prev) =>
        prev.filter((f) => f.deckId !== flashcard.deckId),
      );
      toast.success("Flashcard suspended");
      void fetchFlashcards();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to suspend flashcard";
      toast.error(message);
    }
  };

  // todo: not easily supportable; so far has been implemented via triggers.
  // const handleStudyFlashcard = async (flashcard: FlashcardWithDeck) => {
  //   try {
  //     await createCardStudy(flashcard.id);
  //     setFlashcards((prev) =>
  //       prev.filter((f) => f.deckId !== flashcard.deckId),
  //     );
  //     toast.success("Flashcard suspended");
  //     void fetchDecks();
  //   } catch (err) {
  //     const message =
  //       err instanceof Error ? err.message : "Failed to suspend flashcard";
  //     toast.error(message);
  //   }
  // };

  // Fetch on mount and when filters change
  useEffect(() => {
    void fetchFlashcards();
  }, [fetchFlashcards]);

  // Initial fetch on mount
  useEffect(() => {
    void fetchDecks();
  }, [fetchDecks]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-row gap-x-2 w-full">
              <DeckSelector
                decks={decks}
                value={selectedDeck?.name}
                onChange={(deck) => setSelectedDeck(deck)}
              />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flashcards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && flashcards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No flashcards found. Start by adding words from translations or
              inflections.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Flashcard list */}
      {!isLoading && flashcards.length > 0 && (
        <div className="space-y-3">
          {flashcards.map((flashcard) => (
            <Flashcard
              key={flashcard.id}
              flashcard={flashcard}
              isOwner={profile.id === flashcard.deck?.userId}
              onDelete={handleDelete}
              onStudy={() => {}}
              onSuspend={handleSuspendFlashcard}
              onUpdate={(updated) => {
                setFlashcards((prev) =>
                  prev.map((f) => (f.id === updated.id ? updated : f)),
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
