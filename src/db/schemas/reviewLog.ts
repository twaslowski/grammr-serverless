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
} from "drizzle-orm/pg-core";

import { cardState, rating } from "@/db/schemas/enum";
import { flashcardStudy } from "@/db/schemas/flashcardStudy";

export const reviewLogs = pgTable(
  "review_log",
  {
    id: serial().primaryKey().notNull(),
    flashcardStudyId: integer("flashcard_study_id").notNull(),
    rating: rating().notNull(),
    state: cardState().notNull(),
    due: timestamp().notNull(),
    stability: doublePrecision().notNull(),
    difficulty: doublePrecision().notNull(),
    elapsedDays: integer("elapsed_days").notNull(),
    lastElapsedDays: integer("last_elapsed_days").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    learningSteps: integer("learning_steps").notNull(),
    review: timestamp()
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("idx_review_log_flashcard_study_id").using(
      "btree",
      table.flashcardStudyId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.flashcardStudyId],
      foreignColumns: [flashcardStudy.id],
      name: "review_log_card_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("owned entity access", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(EXISTS ( SELECT 1
   FROM flashcard_study
  WHERE ((flashcard_study.id = review_log.flashcard_study_id) AND (flashcard_study.user_id = ( SELECT auth.uid() AS uid)))))`,
    }),
  ],
);
