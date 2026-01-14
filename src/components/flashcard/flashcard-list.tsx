"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  Table2,
} from "lucide-react";
import {
  FlashcardWithDeck,
  Deck,
  FlashcardListQuery,
} from "@/types/flashcards";
import { getFlashcards, deleteFlashcard, getDecks } from "@/lib/flashcards";
import toast from "react-hot-toast";

interface FlashcardListProps {
  initialFlashcards?: FlashcardWithDeck[];
  initialDecks?: Deck[];
}

export function FlashcardList({
  initialFlashcards = [],
  initialDecks = [],
}: FlashcardListProps) {
  const [flashcards, setFlashcards] =
    useState<FlashcardWithDeck[]>(initialFlashcards);
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at">(
    "created_at",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Expanded cards
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const fetchFlashcards = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query: FlashcardListQuery = {
        search: searchQuery || undefined,
        deck_id: selectedDeckId || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
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
  };

  const fetchDecks = async () => {
    try {
      const data = await getDecks();
      setDecks(data);
    } catch (err) {
      console.error("Failed to fetch decks:", err);
    }
  };

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

  const toggleExpanded = (id: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Fetch on mount and when filters change
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchFlashcards();
  };

  // Initial fetch on mount
  useEffect(() => {
    if (initialFlashcards.length === 0) {
      void fetchFlashcards();
    }
    if (initialDecks.length === 0) {
      void fetchDecks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
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
                <select
                  className="px-3 py-2 border rounded-md text-sm bg-background"
                  value={selectedDeckId || ""}
                  onChange={(e) =>
                    setSelectedDeckId(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                >
                  <option value="">All Decks</option>
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border rounded-md text-sm bg-background"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "created_at" | "updated_at")
                  }
                >
                  <option value="created_at">Created Date</option>
                  <option value="updated_at">Updated Date</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleSortOrder}
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
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
          {flashcards.map((flashcard) => {
            const isExpanded = expandedCards.has(flashcard.id);
            const hasInflections =
              flashcard.back.inflections &&
              flashcard.back.inflections.length > 0;

            return (
              <Card key={flashcard.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {flashcard.front}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {flashcard.back.translation}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{flashcard.type}</Badge>
                      {flashcard.deck && (
                        <Badge variant="secondary">{flashcard.deck.name}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {flashcard.notes && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Notes:</span>{" "}
                      {flashcard.notes}
                    </p>
                  )}

                  {hasInflections && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(flashcard.id)}
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
                                    {inflection.features
                                      .map((f) => f.value)
                                      .join(", ")}
                                    :
                                  </span>
                                  <span className="font-medium">
                                    {inflection.inflected}
                                  </span>
                                </div>
                              ))}
                            {flashcard.back.inflections!.length > 10 && (
                              <div className="col-span-2 text-xs text-muted-foreground">
                                ... and{" "}
                                {flashcard.back.inflections!.length - 10} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(flashcard.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(flashcard.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
