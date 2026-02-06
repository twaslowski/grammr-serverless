import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Profile table
export const profile = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
