import { z } from "zod";

import { LanguageCodeSchema } from "@/types/languages";

/**
 * Wire-format schema for a deck.
 *
 * Hand-written rather than derived from the Drizzle table via `drizzle-zod`:
 * these schemas are imported by client components, and deriving them pulls the
 * whole `drizzle-orm/pg-core` table definition — RLS policy SQL included — into
 * the browser bundle.
 *
 * `src/types/test/schema-parity.test.ts` asserts this stays in sync with the
 * `deck` table.
 */
export const DeckVisibilityEnum = z.enum(["private", "public"]);
export type DeckVisibility = z.infer<typeof DeckVisibilityEnum>;

export const DeckSchema = z.object({
  id: z.number().int(),
  name: z.string().max(255),
  userId: z.string().nullable(),
  description: z.string().nullable(),
  isDefault: z
    .boolean()
    .nullish()
    .transform((v) => v ?? undefined),
  createdAt: z.string(),
  updatedAt: z.string(),
  visibility: DeckVisibilityEnum,
  language: LanguageCodeSchema,
  isStudying: z.boolean().optional(),
});
export type Deck = z.infer<typeof DeckSchema>;
