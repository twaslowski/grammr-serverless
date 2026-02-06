import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { Deck, DeckSchema } from "@/types/flashcards";
import { LanguageCode } from "@/types/languages";

export const saveProfile = async (
  id: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
) => {
  /**
   * Update profile. When languages are changed, find a public deck in the target language and study it.
   * This assumes the existence of only one public deck per language, which makes sense initially.
   * Later we might have to add additional discriminators (admin-owned decks).
   */
  const supabase = createClient();

  // Use upsert to handle both new profiles and existing profiles without languages
  const { error: upsertError } = await supabase.from("profiles").upsert({
    id: id,
    source_language: sourceLanguage,
    target_language: targetLanguage,
  });

  if (upsertError) throw upsertError;

  void syncDeckStudies(id, targetLanguage);
};

export const syncDeckStudies = async (
  userId: string,
  language: LanguageCode,
) => {
  const decks = await getPublicDecks(language);
  if (!decks || decks.length === 0) return;

  void studyDeck(userId, decks[0]);
};

export const getPublicDecks = async (
  language: LanguageCode,
): Promise<Deck[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("deck")
    .select("*")
    .eq("language", language)
    .eq("visibility", "public");

  if (error) throw error;

  return z.array(DeckSchema).parse(data);
};

export const studyDeck = async (userId: string, deck: Deck) => {
  const supabase = createClient();

  const { error } = await supabase.from("deck_study").upsert({
    user_id: userId,
    deck_id: deck.id,
    is_active: true,
  });

  if (error) throw error;
};
