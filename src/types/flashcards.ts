import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { flashcards } from "@/db/schemas";
import { DeckSchema } from "@/types/deck";
import { FeatureSchema } from "@/types/feature";

import { ParadigmSchema, PartOfSpeechEnum } from "./inflections";

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

export const AnalysisFlashcardBackSchema = z.object({
  type: z.literal("analysis"),
  source_phrase: z.string(),
  translation: z.string(),
  tokens: z.array(
    z.object({
      text: z.string(),
      lemma: z.string(),
      pos: PartOfSpeechEnum,
      features: z.array(FeatureSchema).default([]),
      paradigm: ParadigmSchema.optional(),
    }),
  ),
});
export type AnalysisFlashcardBack = z.infer<typeof AnalysisFlashcardBackSchema>;

export const FlashcardBackSchema = z.discriminatedUnion("type", [
  ParadigmFlashcardBackSchema,
  SimpleFlashcardBackSchema,
  AnalysisFlashcardBackSchema,
]);
export type FlashcardBack = z.infer<typeof FlashcardBackSchema>;

// Create base schema from Drizzle table and refine the 'back' field
export const FlashcardSchema = createSelectSchema(flashcards, {
  back: FlashcardBackSchema,
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

// Flashcard with deck info (for list view)
export const FlashcardWithDeckSchema = FlashcardSchema.extend({
  deck: DeckSchema.pick({ id: true, name: true, userId: true }).optional(),
  studyCard: z.number().optional(),
});
export type FlashcardWithDeck = z.infer<typeof FlashcardWithDeckSchema>;
