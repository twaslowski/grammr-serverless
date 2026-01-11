import { z } from "zod";

export const PhraseTranslationRequestSchema = z.object({
  text: z.string().min(1),
  source_language: z.string(),
  target_language: z.string(),
});

export type PhraseTranslationRequest = z.infer<
  typeof PhraseTranslationRequestSchema
>;

export const PhraseTranslationResponseSchema = z.object({
  text: z.string(),
  source_language: z.string(),
  target_language: z.string(),
  translation: z.string(),
});

export type PhraseTranslationResponse = z.infer<
  typeof PhraseTranslationResponseSchema
>;

export const LiteralTranslationRequestSchema = z.object({
  phrase: z.string().min(1),
  word: z.string().min(1),
  source_language: z.string(),
  target_language: z.string(),
});

export type LiteralTranslationRequest = z.infer<
  typeof LiteralTranslationRequestSchema
>;

export const LiteralTranslationResponseSchema = z.object({
  phrase: z.string(),
  word: z.string(),
  source_language: z.string(),
  target_language: z.string(),
  translation: z.string(),
});

export type LiteralTranslationResponse = z.infer<
  typeof LiteralTranslationResponseSchema
>;
