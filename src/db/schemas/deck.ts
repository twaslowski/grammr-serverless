import { boolean, pgTable, serial, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "@/db/schemas/timestamp";

// Deck table
export const decks = pgTable("deck", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: uuid("user_id").notNull(),
  visibility: text("visibility").notNull().default("private"),
  description: text("description"),
  language: text("language").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  ...timestamps,
});
