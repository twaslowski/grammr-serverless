import { z } from "zod";

import { LanguageCodeSchema } from "@/types/languages";

export const TranslationRequestSchema = z.object({
  text: z.string().min(1),
  source_language: LanguageCodeSchema,
  target_language: LanguageCodeSchema,
  context: z.string().optional(),
});

export const TranslationResponseSchema = z.object({
  translation: z.string().min(1),
});

export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;
export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;
