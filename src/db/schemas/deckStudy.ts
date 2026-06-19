import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  pgPolicy,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import { decks } from "@/db/schemas/deck";

export const deckStudy = pgTable(
  "deck_study",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    deckId: integer("deck_id"),
    userId: uuid("user_id"),
    lastStudiedAt: timestamp("last_studied_at", { mode: "string" }),
    isActive: boolean("is_active").default(true),
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
      name: "deck_study_deck_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: "deck_study_user_id_fkey",
    }).onDelete("cascade"),
    unique("deck_study_deck_id_user_id_key").on(table.deckId, table.userId),
    pgPolicy("owned entity access", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
  ],
);
