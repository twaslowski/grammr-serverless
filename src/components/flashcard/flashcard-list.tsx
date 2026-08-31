"use client";

import React from "react";
import { Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";

import { useProfile } from "@/components/dashboard/profile-provider";
import { useFlashcardPages } from "@/components/flashcard/use-flashcard-pages";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirmation-provider";
import { InfiniteScrollSentinel } from "@/components/ui/infinite-scroll-sentinel";
import { Input } from "@/components/ui/input";
import { deleteFlashcard } from "@/lib/flashcards";

import { Flashcard } from "./flashcard";

export function FlashcardList() {
  const profile = useProfile();
  const confirm = useConfirm();
  const {
    items,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    search,
    setSearch,
    remove,
    replace,
  } = useFlashcardPages();

  const handleDelete = (id: number) => {
    confirm({
      title: "Delete flashcard",
      description:
        "This removes the card and its review history. It cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        try {
          await deleteFlashcard(id);
          remove(id);
          toast.success("Flashcard deleted");
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to delete flashcard";
          toast.error(message);
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search your cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search flashcards"
          className="h-11 pl-9"
        />
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-label="Loading flashcards"
          />
        </div>
      )}

      {!isLoading && items.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {search
                ? `No cards match "${search}".`
                : "No cards yet. Add them from the dictionary or while translating."}
            </p>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((flashcard) => (
            <Flashcard
              key={flashcard.id}
              flashcard={flashcard}
              isOwner={profile.id === flashcard.deck?.userId}
              onDelete={handleDelete}
              onUpdate={replace}
            />
          ))}
        </div>
      )}

      {!isLoading && hasMore && (
        <InfiniteScrollSentinel
          onLoadMore={loadMore}
          isLoading={isLoadingMore}
        />
      )}
    </div>
  );
}
