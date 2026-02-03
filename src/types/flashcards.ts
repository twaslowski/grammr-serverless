import { z } from "zod";

import { snakeToCamel } from "@/lib/utils";
import { FeatureSchema } from "@/types/feature";

import { ParadigmSchema, PartOfSpeechEnum } from "./inflections";

// Flashcard type enum
export const FlashcardTypeEnum = z.enum(["word", "phrase", "analysis"]);
export type FlashcardType = z.infer<typeof FlashcardTypeEnum>;

export const DeckVisibilityEnum = z.enum(["private", "public"]);

export const DeckSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.uuid(),
  visibility: DeckVisibilityEnum,
  description: z.string().nullable(),
  is_default: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Deck = z.infer<typeof DeckSchema>;

export const DeckStudySchema = z
  .object({
    id: z.uuid(),
    deck_id: z.number(),
    user_id: z.uuid(),
    last_studied_at: z.string().nullable(),
    is_active: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform(snakeToCamel);
export type DeckStudy = z.infer<typeof DeckStudySchema>;

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

export const FlashcardSchema = z.object({
  id: z.number(),
  deck_id: z.number(),
  front: z.string(),
  back: FlashcardBackSchema,
  notes: z.string().nullable(),
  version: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;

// Flashcard with deck info (for list view)
export const FlashcardWithDeckSchema = FlashcardSchema.extend({
  deck: DeckSchema.pick({ id: true, name: true }).optional(),
});
export type FlashcardWithDeck = z.infer<typeof FlashcardWithDeckSchema>;
