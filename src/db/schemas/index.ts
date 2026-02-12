/**
 * Central schema export file
 *
 * This file serves as the single point of import for all database schemas and their relations.
 *
 * To avoid circular dependency issues:
 * 1. Individual schema files (deck.ts, profile.ts, etc.) only define table structures
 * 2. All relations are defined here in this central file
 * 3. Always import schemas from "@/db/schemas" (this index file) rather than individual files
 *
 * When adding a new schema:
 * 1. Create the table definition in its own file (without relations or cross-imports)
 * 2. Export it here with `export * from "./yourSchema"`
 * 3. Import the table here and define its relations below
 */

import { relations } from "drizzle-orm";

// Import all tables
export * from "./deck";
export * from "./deckStudy";
export * from "./flashcard";
export * from "./flashcardStudy";
export * from "./profile";
export * from "./reviewLog";

import { decks } from "./deck";
import { deckStudy } from "./deckStudy";
import { flashcards } from "./flashcard";
import { flashcardStudy } from "./flashcardStudy";
import { profile } from "./profile";
import { reviewLogs } from "./reviewLog";

// Define all relations in one place to avoid circular dependencies

export const profileRelations = relations(profile, ({ many }) => ({
  decks: many(decks),
  cards: many(flashcardStudy),
  deckStudy: many(deckStudy),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(profile, {
    fields: [decks.userId],
    references: [profile.id],
  }),
  flashcards: many(flashcards),
  deckStudy: many(deckStudy),
}));

export const deckStudyRelations = relations(deckStudy, ({ one }) => ({
  deck: one(decks, {
    fields: [deckStudy.deckId],
    references: [decks.id],
  }),
  user: one(profile, {
    fields: [deckStudy.userId],
    references: [profile.id],
  }),
}));

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  deck: one(decks, {
    fields: [flashcards.deckId],
    references: [decks.id],
  }),
  studyCards: many(flashcardStudy),
}));

export const cardsRelations = relations(flashcardStudy, ({ one, many }) => ({
  flashcard: one(flashcards, {
    fields: [flashcardStudy.flashcardId],
    references: [flashcards.id],
  }),
  user: one(profile, {
    fields: [flashcardStudy.userId],
    references: [profile.id],
  }),
  reviewLogs: many(reviewLogs),
}));

export const reviewLogsRelations = relations(reviewLogs, ({ one }) => ({
  studyCard: one(flashcardStudy, {
    fields: [reviewLogs.cardId],
    references: [flashcardStudy.id],
  }),
}));
