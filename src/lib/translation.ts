import { createClient } from "@/lib/supabase/client";
import {
  PhraseTranslationRequest,
  PhraseTranslationResponse,
  LiteralTranslationRequest,
  LiteralTranslationResponse,
} from "@/types/translation";

export async function translatePhrase(
  request: PhraseTranslationRequest,
): Promise<PhraseTranslationResponse> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke(
    "phrase-translation",
    {
      body: request,
    },
  );

  if (error) {
    throw new Error(error.message || "Failed to translate phrase");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as PhraseTranslationResponse;
}

export async function translateWord(
  request: LiteralTranslationRequest,
): Promise<LiteralTranslationResponse> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke(
    "literal-translation",
    {
      body: request,
    },
  );

  if (error) {
    throw new Error(error.message || "Failed to translate word");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as LiteralTranslationResponse;
}
