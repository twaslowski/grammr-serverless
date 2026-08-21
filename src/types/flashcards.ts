import { z } from "zod";

import { DeckSchema } from "@/types/deck";

import { ParadigmSchema } from "./inflections";
import { EnrichedMorphologicalAnalysisSchema } from "./morphology";

// Separate schemas for each type
export const ParadigmFlashcardBackSchema = z.object({
  type: z.literal("word"),
  translation: z.string(),
  paradigm: ParadigmSchema,
});
export type ParadigmFlashcardBack = z.infer<typeof ParadigmFlashcardBackSchema>;

export const SimpleFlashcardBackSchema = z.object({
  type: z.literal("phrase"),
  translation: z.string(),
});
export type PhraseFlashcardBack = z.infer<typeof SimpleFlashcardBackSchema>;

export const AnalysisFlashcardBackSchema =
  EnrichedMorphologicalAnalysisSchema.extend({
    type: z.literal("analysis"),
    translation: z.string(),
  });
export type AnalysisFlashcardBack = z.infer<typeof AnalysisFlashcardBackSchema>;

export const FlashcardBackSchema = z.discriminatedUnion("type", [
  ParadigmFlashcardBackSchema,
  SimpleFlashcardBackSchema,
  AnalysisFlashcardBackSchema,
]);
export type FlashcardBack = z.infer<typeof FlashcardBackSchema>;

/**
 * Wire-format schema for a flashcard. Hand-written so client components do not
 * pull the Drizzle table definition into the browser bundle; kept honest by
 * `src/types/test/schema-parity.test.ts`.
 */
export const FlashcardSchema = z.object({
  id: z.number().int(),
  deckId: z.number().int().nullable(),
  front: z.string(),
  back: FlashcardBackSchema,
  notes: z.string().nullable(),
  version: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

// Flashcard with deck info (for list view)
export const FlashcardWithDeckSchema = FlashcardSchema.extend({
  deck: DeckSchema.pick({ id: true, name: true, userId: true }).optional(),
  studyCard: z.number().optional(),
});
export type FlashcardWithDeck = z.infer<typeof FlashcardWithDeckSchema>;
