"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useDebounce } from "use-debounce";

import { FlashcardListQuery } from "@/app/api/v1/flashcards/schema";
import { useProfile } from "@/components/dashboard/profile-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteFlashcard, getFlashcards } from "@/lib/flashcards";
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
  const profile = useProfile();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query: FlashcardListQuery = {
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
  }, [debouncedSearchQuery]);

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
  useEffect(() => {
    // Effect-driven data fetching: loading/result state is set after an await.
    // The real fix is to fetch on the server and pass the data in as props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFlashcards();
  }, [fetchFlashcards]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-row gap-x-2 w-full">
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
