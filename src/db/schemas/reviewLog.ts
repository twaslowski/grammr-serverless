import {
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const ratingEnum = pgEnum("rating", ["Again", "Hard", "Good", "Easy"]);

export const reviewLogs = pgTable("review_log", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull(),
  rating: ratingEnum("rating").notNull(),
  state: integer("state").notNull(),
  due: timestamp("due").notNull(),
  stability: doublePrecision("stability").notNull(),
  difficulty: doublePrecision("difficulty").notNull(),
  elapsedDays: integer("elapsed_days").notNull(),
  lastElapsedDays: integer("last_elapsed_days").notNull(),
  scheduledDays: integer("scheduled_days").notNull(),
  learningSteps: integer("learning_steps").notNull(),
  review: timestamp("review").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
