// Request schemas
import { FlashcardBackSchema, FlashcardTypeEnum } from "@/types/flashcards";
import { z } from "zod";

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
