import { defineRelations } from "drizzle-orm/relations";
import { authUsers } from "drizzle-orm/supabase";

import * as schema from "./schema";

export const relations = defineRelations({ ...schema, authUsers }, (r) => ({
  decks: {
    deckStudies: r.many.deckStudy(),
    flashcardStudies: r.many.flashcardStudy(),
    usersInAuth: r.one.authUsers({
      from: r.decks.userId,
      to: r.authUsers.id,
    }),
    flashcards: r.many.flashcards(),
  },

  profiles: {
    user: r.one.authUsers({
      from: r.profiles.id,
      to: r.authUsers.id,
    }),
  },

  deckStudy: {
    deck: r.one.decks({
      from: r.deckStudy.deckId,
      to: r.decks.id,
    }),
    usersInAuth: r.one.authUsers({
      from: r.deckStudy.userId,
      to: r.authUsers.id,
    }),
  },

  flashcardStudy: {
    flashcard: r.one.flashcards({
      from: r.flashcardStudy.flashcardId,
      to: r.flashcards.id,
    }),
    usersInAuth: r.one.authUsers({
      from: r.flashcardStudy.userId,
      to: r.authUsers.id,
    }),
    deck: r.one.decks({
      from: r.flashcardStudy.deckId,
      to: r.decks.id,
    }),
    reviewLogs: r.many.reviewLogs(),
  },

  flashcards: {
    deck: r.one.decks({
      from: r.flashcards.deckId,
      to: r.decks.id,
    }),
    flashcardStudies: r.many.flashcardStudy(),
  },

  reviewLogs: {
    flashcardStudy: r.one.flashcardStudy({
      from: r.reviewLogs.flashcardStudyId,
      to: r.flashcardStudy.id,
    }),
  },
}));
