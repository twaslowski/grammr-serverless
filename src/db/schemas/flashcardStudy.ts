import { sql } from "drizzle-orm";
import {
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgPolicy,
  pgTable,
  serial,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import { flashcards } from "@/db/schemas/flashcard";
import { cardState } from "@/db/schemas/index";

import { decks } from "./deck";

export const flashcardStudy = pgTable(
  "flashcard_study",
  {
    id: serial().primaryKey().notNull(),
    flashcardId: integer("flashcard_id").notNull(),
    userId: uuid("user_id").notNull(),
    due: timestamp()
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    stability: doublePrecision().default(0).notNull(),
    difficulty: doublePrecision().default(0).notNull(),
    elapsedDays: integer("elapsed_days").default(0).notNull(),
    scheduledDays: integer("scheduled_days").default(0).notNull(),
    learningSteps: integer("learning_steps").default(0).notNull(),
    reps: integer().default(0).notNull(),
    lapses: integer().default(0).notNull(),
    state: cardState().default("New").notNull(),
    lastReview: timestamp("last_review"),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deckId: integer("deck_id").notNull(),
  },
  (table) => [
    index("idx_flashcard_study_deck_id").using(
      "btree",
      table.deckId.asc().nullsLast(),
    ),
    index("idx_flashcard_study_due")
      .using(
        "btree",
        table.userId.asc().nullsLast(),
        table.due.asc().nullsLast(),
      )
      .where(sql`(state <> 'New'::card_state)`),
    index("idx_flashcard_study_user_state").using(
      "btree",
      table.userId.asc().nullsLast(),
      table.state.asc().nullsLast(),
    ),
    foreignKey({
      columns: [table.flashcardId],
      foreignColumns: [flashcards.id],
      name: "card_flashcard_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: "card_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.deckId],
      foreignColumns: [decks.id],
      name: "fk_card_deck_id",
    }).onDelete("cascade"),
    unique("card_flashcard_id_user_id_key").on(table.flashcardId, table.userId),
    pgPolicy("owned entity access", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`((SELECT auth.uid() AS uid) = user_id)`,
    }),
  ],
);
