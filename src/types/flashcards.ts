import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { decks, flashcards } from "@/db/schemas";
import { FeatureSchema } from "@/types/feature";

import { ParadigmSchema, PartOfSpeechEnum } from "./inflections";

// Flashcard type enum
export const FlashcardTypeEnum = z.enum(["word", "phrase", "analysis"]);

export const DeckVisibilityEnum = z.enum(["private", "public"]);
export type DeckVisibility = z.infer<typeof DeckVisibilityEnum>;

export const DeckSchema = createSelectSchema(decks);
export type Deck = z.infer<typeof DeckSchema>;

// Separate schemas for each type
export const ParadigmFlashcardBackSchema = z.object({
  translation: z.string(),
  type: z.literal("word"),
  paradigm: ParadigmSchema,
});
export type ParadigmFlashcardBack = z.infer<typeof ParadigmFlashcardBackSchema>;

export const PhraseFlashcardBackSchema = z.object({
  translation: z.string(),
  type: z.literal("phrase"),
});
export type PhraseFlashcardBack = z.infer<typeof PhraseFlashcardBackSchema>;

export const AnalysisFlashcardBackSchema = z.object({
  source_phrase: z.string(),
  translation: z.string(),
  type: z.literal("analysis"),
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
  PhraseFlashcardBackSchema,
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
});
export type FlashcardWithDeck = z.infer<typeof FlashcardWithDeckSchema>;
