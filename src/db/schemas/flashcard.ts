import { integer, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";

import { timestamps } from "@/db/schemas/timestamp";

// Flashcard table
export const flashcards = pgTable("flashcard", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  front: text("front").notNull(),
  back: jsonb("back").notNull(),
  notes: text("notes"),
  version: integer("version").notNull().default(1),
  ...timestamps,
});
