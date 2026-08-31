import { z } from "zod";

import { DeckSchema } from "@/types/deck";

import { ParadigmSchema } from "./inflections";
import { EnrichedMorphologicalAnalysisSchema } from "./morphology";

/**
 * Every kind of back carries a translation — that is the one thing a reviewer is
 * always being asked to recall — so it lives on a shared base rather than being
 * repeated per variant. Consumers rely on it: `flashcard.tsx` reads
 * `back.translation` without narrowing, and both dialogs edit it with
 * `{ ...back, translation }`.
 */
export const FlashcardBackBaseSchema = z.object({
  translation: z.string(),
});

export const ParadigmFlashcardBackSchema = FlashcardBackBaseSchema.extend({
  type: z.literal("word"),
  paradigm: ParadigmSchema,
});
export type ParadigmFlashcardBack = z.infer<typeof ParadigmFlashcardBackSchema>;

export const SimpleFlashcardBackSchema = FlashcardBackBaseSchema.extend({
  type: z.literal("phrase"),
});
export type PhraseFlashcardBack = z.infer<typeof SimpleFlashcardBackSchema>;

export const AnalysisFlashcardBackSchema =
  EnrichedMorphologicalAnalysisSchema.extend({
    ...FlashcardBackBaseSchema.shape,
    type: z.literal("analysis"),
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

/**
 * One page of the flashcard list.
 *
 * A response envelope rather than a table, so it has no counterpart in
 * `schema-parity.test.ts`. `nextOffset` is `null` at the end of the list, which
 * is what the caller stops on — a short page is not a reliable signal.
 */
export const FlashcardPageSchema = z.object({
  items: z.array(FlashcardWithDeckSchema),
  nextOffset: z.number().int().nullable(),
});
export type FlashcardPage = z.infer<typeof FlashcardPageSchema>;
