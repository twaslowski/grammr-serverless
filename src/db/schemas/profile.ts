import { sql } from "drizzle-orm";
import {
  foreignKey,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import { LanguageCode } from "@/types/languages";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid().primaryKey().notNull(),
    sourceLanguage: varchar("source_language", { length: 3 })
      .$type<LanguageCode>()
      .notNull(),
    targetLanguage: varchar("target_language", { length: 3 })
      .$type<LanguageCode>()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [authUsers.id],
      name: "profiles_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("owned entity access", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(( SELECT auth.uid() AS uid) = id)`,
    }),
  ],
);
