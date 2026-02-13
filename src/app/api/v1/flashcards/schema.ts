import { z } from "zod";

import { DeckVisibilityEnum } from "@/types/deck";
import { FlashcardBackSchema } from "@/types/flashcards";
import { LanguageCodeSchema } from "@/types/languages";

export const CreateDeckRequestSchema = z.object({
  name: z.string().min(1, "Deck name is required"),
  language: LanguageCodeSchema.optional(),
  description: z.string().optional(),
  visibility: DeckVisibilityEnum.optional(),
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
  back: FlashcardBackSchema,
  notes: z.string().optional(),
});
export type CreateFlashcardRequest = z.infer<
  typeof CreateFlashcardRequestSchema
>;

export const UpdateFlashcardRequestSchema = z.object({
  front: z.string().min(1).optional(),
  back: FlashcardBackSchema.optional(),
  notes: z.string().nullable().optional(),
  deck_id: z.number().optional(),
});
export type UpdateFlashcardRequest = z.infer<
  typeof UpdateFlashcardRequestSchema
>;

export const FlashcardListQuerySchema = z.object({
  deckId: z.coerce.number().optional(),
  search: z.string().optional(),
});
export type FlashcardListQuery = z.infer<typeof FlashcardListQuerySchema>;

// Export schema - for exporting flashcards (without progress data)
export const ExportedFlashcardSchema = z.object({
  front: z.string(),
  back: FlashcardBackSchema,
  notes: z.string().nullable(),
  deck_name: z.string(),
});

export const FlashcardExportSchema = z.object({
  version: z.literal("1.0"),
  exported_at: z.string(),
  language: LanguageCodeSchema.optional(),
  visibility: DeckVisibilityEnum.optional(),
  flashcards: z.array(ExportedFlashcardSchema),
});
export type FlashcardExport = z.infer<typeof FlashcardExportSchema>;

// Import schema - for importing flashcards
export const ImportFlashcardSchema = z.object({
  front: z.string().min(1, "Front content is required"),
  back: FlashcardBackSchema,
  notes: z.string().nullable().optional(),
});

export const FlashcardImportRequestSchema = z.object({
  version: z.string(),
  deckId: z.number(),
  flashcards: z.array(ImportFlashcardSchema),
});
export type FlashcardImportRequest = z.infer<
  typeof FlashcardImportRequestSchema
>;
