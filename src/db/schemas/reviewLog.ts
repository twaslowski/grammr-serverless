import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

import { cardStateEnum, ratingEnum } from "@/db/schemas/enum";

export const reviewLogs = pgTable("review_log", {
  id: serial("id").primaryKey(),
  cardId: integer("flashcard_study_id").notNull(),
  rating: ratingEnum("rating").notNull(),
  state: cardStateEnum("state").notNull(),
  due: timestamp("due").notNull(),
  stability: doublePrecision("stability").notNull(),
  difficulty: doublePrecision("difficulty").notNull(),
  elapsedDays: integer("elapsed_days").notNull(),
  lastElapsedDays: integer("last_elapsed_days").notNull(),
  scheduledDays: integer("scheduled_days").notNull(),
  learningSteps: integer("learning_steps").notNull(),
  review: timestamp("review").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
