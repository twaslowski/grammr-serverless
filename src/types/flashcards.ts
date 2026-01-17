import { z } from "zod";
import { ParadigmSchema } from "./inflections";

// Flashcard type enum
export const FlashcardTypeEnum = z.enum(["word", "phrase"]);
export type FlashcardType = z.infer<typeof FlashcardTypeEnum>;

export const DeckSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.string().uuid(),
  description: z.string().nullable(),
  is_default: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Deck = z.infer<typeof DeckSchema>;

// Flashcard back content schema
export const FlashcardBackSchema = z.object({
  translation: z.string(),
  paradigm: ParadigmSchema.optional(),
});
export type FlashcardBack = z.infer<typeof FlashcardBackSchema>;

export const FlashcardSchema = z.object({
  id: z.number(),
  deck_id: z.number(),
  front: z.string(),
  type: FlashcardTypeEnum,
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

// Flashcard progress schema
export const FlashcardProgressSchema = z.object({
  id: z.number(),
  flashcard_id: z.number(),
  user_id: z.string().uuid(),
  ease_factor: z.number(),
  interval: z.number(),
  repetitions: z.number(),
  next_review_at: z.string(),
  last_reviewed_at: z.string().nullable(),
});
