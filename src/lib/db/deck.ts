import { queryWithValidation } from "@/lib/db/database";
import { createClient } from "@/lib/supabase/client";
import { DeckSchema } from "@/types/flashcards";

export const findDeck = async (deckName: string) => {
  const supabase = createClient();

  await queryWithValidation(
    supabase,
    (sb) => sb.from("deck").select("*").eq("name", deckName),
    DeckSchema,
  );
};
