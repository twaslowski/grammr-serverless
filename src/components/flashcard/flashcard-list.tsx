"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Deck, FlashcardWithDeck } from "@/types/flashcards";
import { getFlashcards, deleteFlashcard } from "@/lib/flashcards";
import { Flashcard } from "./flashcard";
import toast from "react-hot-toast";
import { FlashcardListQuery } from "@/app/api/v1/flashcards/schema";

interface FlashcardListProps {
  initialFlashcards?: FlashcardWithDeck[];
  fetchFlashcards?: () => Promise<FlashcardWithDeck[]>;
  decks: Deck[];
}

export function FlashcardList({
  initialFlashcards = [],
  decks,
}: FlashcardListProps) {
  const sortOrder = "desc";
  const sortBy = "created_at";

  const [flashcards, setFlashcards] =
    useState<FlashcardWithDeck[]>(initialFlashcards);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<number | undefined>(
    decks.length === 1 ? decks[0].id : undefined,
  );

  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query: FlashcardListQuery = {
        search: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        deck_id: selectedDeckId,
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
  }, [searchQuery, sortBy, sortOrder, selectedDeckId]);

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

  // Fetch on mount and when filters change
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchFlashcards();
  };

  // Fetch when deck changes
  useEffect(() => {
    if (selectedDeckId !== undefined || decks.length === 0) {
      void fetchFlashcards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeckId]);

  // Initial fetch on mount
  useEffect(() => {
    if (initialFlashcards.length === 0) {
      void fetchFlashcards();
    }
  }, [fetchFlashcards, initialFlashcards?.length]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {decks.length > 1 && (
                <div>
                  <label
                    htmlFor="deck-select"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Deck
                  </label>
                  <select
                    id="deck-select"
                    value={selectedDeckId ?? ""}
                    onChange={(e) =>
                      setSelectedDeckId(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="block w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="">All Decks</option>
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search flashcards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </div>
          </form>
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
              onDelete={handleDelete}
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
