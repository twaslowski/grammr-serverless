import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Deck study table
export const deckStudy = pgTable("deck_study", {
  id: uuid("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  userId: uuid("user_id").notNull(),
  lastStudiedAt: timestamp("last_studied_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

