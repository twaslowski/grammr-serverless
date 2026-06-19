import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

export const decks = pgTable(
  "deck",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    userId: uuid("user_id"),
    description: text(),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    visibility: text().default("private").notNull(),
    language: varchar({ length: 3 }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_only_one_default_deck")
      .using("btree", table.userId.asc().nullsLast().op("uuid_ops"))
      .where(sql`(is_default = true)`),
    uniqueIndex("idx_unique_deck_name_per_user").using(
      "btree",
      sql`user_id`,
      sql`lower((name)::text)`,
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: "deck_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("owned entity access", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
    pgPolicy("public entity read access", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    check(
      "deck_visibility_check",
      sql`visibility = ANY (ARRAY['private'::text, 'public'::text])`,
    ),
  ],
);
