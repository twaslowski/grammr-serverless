"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface InfiniteScrollSentinelProps {
  onLoadMore: () => void;
  isLoading: boolean;
}

/**
 * Loads the next page as the reader approaches the end of the list.
 *
 * The button is not a fallback for old browsers — it is always rendered.
 * Intersection-triggered loading is unreachable by keyboard and invisible to
 * anyone who navigates by tabbing, so the explicit control is the accessible
 * path and the observer is the convenience on top of it.
 */
export function InfiniteScrollSentinel({
  onLoadMore,
  isLoading,
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Kept in a ref so re-creating the callback does not tear down the observer.
  // Written in an effect, not during render, because render must stay pure.
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMoreRef.current();
      },
      // Start fetching before the reader actually reaches the end, so the next
      // page is usually there by the time they would have noticed it missing.
      { rootMargin: "400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex justify-center py-4">
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isLoading}
        className="min-h-11"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? "Loading..." : "Load more"}
      </Button>
    </div>
  );
}
