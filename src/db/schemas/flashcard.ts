import { sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { decks } from "@/db/schemas/deck";

export const flashcards = pgTable(
  "flashcard",
  {
    id: serial().primaryKey().notNull(),
    deckId: integer("deck_id"),
    front: text().notNull(),
    back: jsonb().notNull(),
    notes: text(),
    version: integer().default(1),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.deckId],
      foreignColumns: [decks.id],
      name: "flashcard_deck_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("owned entity access", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(EXISTS ( SELECT 1
                           FROM deck
                           WHERE ((deck.id = flashcard.deck_id) AND (( SELECT auth.uid() AS uid) = deck.user_id))))`,
    }),
    pgPolicy("public entity read access", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
  ],
);
