import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { cardStateEnum } from "@/db/schemas/enum";
import { timestamps } from "@/db/schemas/timestamp";

// Card table (FSRS)
export const flashcardStudy = pgTable("flashcard_study", {
  id: serial("id").primaryKey(),
  flashcardId: integer("flashcard_id").notNull(),
  userId: uuid("user_id").notNull(),
  deckId: integer("deck_id").notNull(),
  due: timestamp("due").notNull().defaultNow(),
  stability: doublePrecision("stability").notNull().default(0),
  difficulty: doublePrecision("difficulty").notNull().default(0),
  elapsedDays: integer("elapsed_days").notNull().default(0),
  scheduledDays: integer("scheduled_days").notNull().default(0),
  learningSteps: integer("learning_steps").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  state: cardStateEnum("state").notNull().default("New"),
  lastReview: timestamp("last_review"),
  ...timestamps,
});
