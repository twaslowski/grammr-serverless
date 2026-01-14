import { z } from "zod";
import { InflectionSchema } from "./inflections";

// Flashcard type enum
export const FlashcardTypeEnum = z.enum(["word", "phrase"]);
export type FlashcardType = z.infer<typeof FlashcardTypeEnum>;

// Flashcard back content schema
export const FlashcardBackSchema = z.object({
  translation: z.string(),
  inflections: z.array(InflectionSchema).optional(),
});
export type FlashcardBack = z.infer<typeof FlashcardBackSchema>;

// Deck schema
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

// Flashcard schema
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
export type FlashcardProgress = z.infer<typeof FlashcardProgressSchema>;

// Request schemas
export const CreateDeckRequestSchema = z.object({
  name: z.string().min(1, "Deck name is required"),
  description: z.string().optional(),
});
export type CreateDeckRequest = z.infer<typeof CreateDeckRequestSchema>;

export const UpdateDeckRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});
export type UpdateDeckRequest = z.infer<typeof UpdateDeckRequestSchema>;

export const CreateFlashcardRequestSchema = z.object({
  deck_id: z.number().optional(), // If not provided, use default deck
  front: z.string().min(1, "Front content is required"),
  type: FlashcardTypeEnum,
  back: FlashcardBackSchema,
  notes: z.string().optional(),
});
export type CreateFlashcardRequest = z.infer<
  typeof CreateFlashcardRequestSchema
>;

export const UpdateFlashcardRequestSchema = z.object({
  front: z.string().min(1).optional(),
  type: FlashcardTypeEnum.optional(),
  back: FlashcardBackSchema.optional(),
  notes: z.string().nullable().optional(),
  deck_id: z.number().optional(),
});
export type UpdateFlashcardRequest = z.infer<
  typeof UpdateFlashcardRequestSchema
>;

// Query params for listing flashcards
export const FlashcardListQuerySchema = z.object({
  deck_id: z.coerce.number().optional(),
  search: z.string().optional().nullable(),
  sort_by: z
    .enum(["created_at", "updated_at"])
    .optional()
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type FlashcardListQuery = z.infer<typeof FlashcardListQuerySchema>;
