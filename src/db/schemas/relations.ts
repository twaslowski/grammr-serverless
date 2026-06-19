import { relations } from "drizzle-orm/relations";
import { authUsers } from "drizzle-orm/supabase";

import {
  decks,
  deckStudy,
  flashcards,
  flashcardStudy,
  profiles,
  reviewLogs,
} from "./index";

export const profilesRelations = relations(profiles, ({ one }) => ({
  usersInAuth: one(authUsers, {
    fields: [profiles.id],
    references: [authUsers.id],
  }),
}));

export const usersInAuthRelations = relations(authUsers, ({ many }) => ({
  profiles: many(profiles),
  deckStudies: many(deckStudy),
  flashcardStudies: many(flashcardStudy),
  decks: many(decks),
}));

export const deckStudyRelations = relations(deckStudy, ({ one }) => ({
  deck: one(decks, {
    fields: [deckStudy.deckId],
    references: [decks.id],
  }),
  usersInAuth: one(authUsers, {
    fields: [deckStudy.userId],
    references: [authUsers.id],
  }),
}));

export const deckRelations = relations(decks, ({ one, many }) => ({
  deckStudies: many(deckStudy),
  flashcardStudies: many(flashcardStudy),
  usersInAuth: one(authUsers, {
    fields: [decks.userId],
    references: [authUsers.id],
  }),
  flashcards: many(flashcards),
}));

export const flashcardStudyRelations = relations(
  flashcardStudy,
  ({ one, many }) => ({
    flashcard: one(flashcards, {
      fields: [flashcardStudy.flashcardId],
      references: [flashcards.id],
    }),
    usersInAuth: one(authUsers, {
      fields: [flashcardStudy.userId],
      references: [authUsers.id],
    }),
    deck: one(decks, {
      fields: [flashcardStudy.deckId],
      references: [decks.id],
    }),
    reviewLogs: many(reviewLogs),
  }),
);

export const flashcardRelations = relations(flashcards, ({ one, many }) => ({
  flashcardStudies: many(flashcardStudy),
  deck: one(decks, {
    fields: [flashcards.deckId],
    references: [decks.id],
  }),
}));

export const reviewLogRelations = relations(reviewLogs, ({ one }) => ({
  flashcardStudy: one(flashcardStudy, {
    fields: [reviewLogs.flashcardStudyId],
    references: [flashcardStudy.id],
  }),
}));
