import { FlashcardList } from "@/components/flashcard";
import { PageLayout } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { DeckSchema } from "@/types/flashcards";
import { z } from "zod";

export default async function FlashcardsPage() {
  // Calling lib.getDecks only works client side, so we directly use supabase here
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deck")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const parsed = z.array(DeckSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("Failed to parse decks");
  }

  return (
    <PageLayout
      header={{
        title: "Flashcards",
        description:
          "Review and manage your flashcards. Add new cards from translations or inflection tables.",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <div className="w-full">
        <FlashcardList decks={parsed.data} />
      </div>
    </PageLayout>
  );
}
