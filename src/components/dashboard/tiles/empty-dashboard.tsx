import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * What a user with no cards sees.
 *
 * Every tile on this screen is a statement about a collection, so with an empty
 * one they would all read zero — a wall of zeros that says "this feature is
 * broken" rather than "you haven't started". One invitation is the better
 * answer, and the dictionary is named first because looking a word up is how
 * cards get made here.
 */
export function EmptyDashboard() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold leading-tight">
            Your deck is empty
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Look a word up in the dictionary and you can turn it into a
            flashcard from there, with its translation and inflections attached.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard/dictionary">
              <BookOpen aria-hidden="true" />
              Look up a word
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/flashcards">
              <Plus aria-hidden="true" />
              Add a card
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
