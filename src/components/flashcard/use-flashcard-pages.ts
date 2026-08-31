"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

import { getFlashcards } from "@/lib/flashcards";
import { FlashcardWithDeck } from "@/types/flashcards";

export interface FlashcardPages {
  items: FlashcardWithDeck[];
  hasMore: boolean;
  /** The first page is loading — show a spinner instead of the list. */
  isLoading: boolean;
  /** A later page is loading — keep the list, show a spinner under it. */
  isLoadingMore: boolean;
  error: string | null;
  loadMore: () => void;
  search: string;
  setSearch: (value: string) => void;
  /** Drop a card locally after the server has accepted its deletion. */
  remove: (id: number) => void;
  /** Swap a card in place after an edit. */
  replace: (card: FlashcardWithDeck) => void;
}

/**
 * The flashcard list, one page at a time.
 *
 * The list used to fetch every card a user had on every render of the page,
 * which was fine at a few dozen and would not stay fine.
 */
export function useFlashcardPages(): FlashcardPages {
  const [items, setItems] = useState<FlashcardWithDeck[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 400);

  /**
   * Guards against a slow earlier request resolving after a faster later one
   * and appending its results to a list that has since been reset — the same
   * pattern the dictionary search uses.
   */
  const requestId = useRef(0);

  const load = useCallback(
    async (offset: number, term: string, append: boolean) => {
      const id = ++requestId.current;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const page = await getFlashcards({
          search: term || undefined,
          offset,
        });
        if (id !== requestId.current) return;

        setItems((prev) => {
          if (!append) return page.items;
          // The server may legitimately repeat a row if one was edited between
          // pages; dedupe rather than render two of it.
          const seen = new Set(prev.map((card) => card.id));
          return [...prev, ...page.items.filter((card) => !seen.has(card.id))];
        });
        setNextOffset(page.nextOffset);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch flashcards",
        );
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [],
  );

  // Reload from the top whenever the search term settles.
  useEffect(() => {
    // Effect-driven data fetching: loading/result state is set after an await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(0, debouncedSearch, false);
  }, [debouncedSearch, load]);

  const loadMore = useCallback(() => {
    if (nextOffset === null || isLoading || isLoadingMore) return;
    void load(nextOffset, debouncedSearch, true);
  }, [nextOffset, isLoading, isLoadingMore, load, debouncedSearch]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((card) => card.id !== id));
  }, []);

  const replace = useCallback((card: FlashcardWithDeck) => {
    setItems((prev) => prev.map((c) => (c.id === card.id ? card : c)));
  }, []);

  return {
    items,
    hasMore: nextOffset !== null,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    search,
    setSearch,
    remove,
    replace,
  };
}
