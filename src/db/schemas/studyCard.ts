import {
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const cardStateEnum = pgEnum("card_state", [
  "New",
  "Learning",
  "Review",
  "Relearning",
]);

// Card table (FSRS)
export const studyCard = pgTable("card", {
  id: serial("id").primaryKey(),
  flashcardId: integer("flashcard_id").notNull(),
  userId: uuid("user_id").notNull(),
  due: timestamp("due").notNull(),
  stability: doublePrecision("stability").notNull(),
  difficulty: doublePrecision("difficulty").notNull(),
  elapsedDays: integer("elapsed_days").notNull(),
  scheduledDays: integer("scheduled_days").notNull(),
  learningSteps: integer("learning_steps").notNull(),
  reps: integer("reps").notNull(),
  lapses: integer("lapses").notNull(),
  state: cardStateEnum("state").notNull(),
  lastReview: timestamp("last_review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
