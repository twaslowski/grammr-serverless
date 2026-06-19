import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { decks } from "@/db/schemas/schema";
import { deckVisibilityEnum } from "@/db/schemas/schema";

export const DeckVisibilityEnum = z.enum(deckVisibilityEnum.enumValues);

export const DeckSchema = createSelectSchema(decks, {
  isDefault: z
    .boolean()
    .nullish()
    .transform((v) => v ?? undefined),
}).extend({
  isStudying: z.boolean().optional(),
});
export type Deck = z.infer<typeof DeckSchema>;
