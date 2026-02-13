import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { decks } from "@/db/schemas";
import { deckVisibilityEnum } from "@/db/schemas/enum";

export const DeckVisibilityEnum = z.enum(deckVisibilityEnum.enumValues);

export const DeckSchema = createSelectSchema(decks).extend({
  isStudying: z.boolean().optional(),
});
export type Deck = z.infer<typeof DeckSchema>;
