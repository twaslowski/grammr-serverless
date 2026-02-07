import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Deck table
export const decks = pgTable("deck", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: uuid("user_id").notNull(),
  visibility: text("visibility").notNull().default("private"),
  description: text("description"),
  language: text("language").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
