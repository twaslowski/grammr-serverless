"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, ArrowRight } from "lucide-react";
import { getDueCardsCount } from "@/lib/study";
import { DueCardsCount } from "@/types/fsrs";

export function StudyDueCards() {
  const [dueCards, setDueCards] = useState<DueCardsCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDueCount = async () => {
      try {
        const count = await getDueCardsCount();
        setDueCards(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDueCount();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Loading...</CardTitle>
            <CardDescription>Checking for cards to review</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return null; // Don't show anything on error
  }

  if (!dueCards || dueCards.dueCount === 0) {
    return (
      <Card className="bg-muted/50 border-muted">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-muted rounded-lg">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-muted-foreground">
              No Cards Due
            </CardTitle>
            <CardDescription>
              All caught up! Check back later for more reviews.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Link href="/dashboard/study">
      <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer group">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {dueCards.dueCount} {dueCards.dueCount === 1 ? "Card" : "Cards"}{" "}
              to Review
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </CardTitle>
            <CardDescription>
              {dueCards.newCount > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  {dueCards.newCount} new
                </span>
              )}
              {dueCards.newCount > 0 && dueCards.reviewCount > 0 && " · "}
              {dueCards.reviewCount > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  {dueCards.reviewCount} to review
                </span>
              )}
            </CardDescription>
          </div>
          <Button size="sm" className="ml-auto">
            Study Now
          </Button>
        </CardHeader>
      </Card>
    </Link>
  );
}
