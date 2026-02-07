import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "@/db/schemas/timestamp";

// Deck study table
export const deckStudy = pgTable("deck_study", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: integer("deck_id").notNull(),
  userId: uuid("user_id").notNull(),
  lastStudiedAt: timestamp("last_studied_at"),
  isActive: boolean("is_active").default(true),
  ...timestamps,
});
