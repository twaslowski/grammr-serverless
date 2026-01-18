import { z } from "zod";
import { LanguageCodeSchema } from "@/types/languages";

export const PhraseTranslationRequestSchema = z.object({
  text: z.string().min(1),
  source_language: LanguageCodeSchema,
  target_language: LanguageCodeSchema,
});

export const PhraseTranslationResponseSchema =
  PhraseTranslationRequestSchema.extend({
    translation: z.string(),
  });

export const LiteralTranslationRequestSchema = z.object({
  phrase: z.string().min(1),
  word: z.string().min(1),
  source_language: LanguageCodeSchema,
  target_language: LanguageCodeSchema,
});

export const LiteralTranslationResponseSchema =
  LiteralTranslationRequestSchema.extend({
    translation: z.string(),
  });

// type exports
export type LiteralTranslationRequest = z.infer<
  typeof LiteralTranslationRequestSchema
>;

export type PhraseTranslationRequest = z.infer<
  typeof PhraseTranslationRequestSchema
>;

export type PhraseTranslationResponse = z.infer<
  typeof PhraseTranslationResponseSchema
>;

export type LiteralTranslationResponse = z.infer<
  typeof LiteralTranslationResponseSchema
>;
