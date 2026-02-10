import { Deck } from "@/types/deck";
import { Flashcard } from "@/types/flashcards";

export const deckFixture: Deck = {
  id: 1,
  name: "German Verbs",
  userId: "123e4567-e89b-12d3-a456-426614174000",
  description: "A deck of common German verbs",
  createdAt: "2026-01-17T19:00:00",
  updatedAt: "2026-01-17T19:00:00",
  visibility: "private",
  isDefault: true,
  language: "de",
};

export const simpleFlashcardFixture: Flashcard = {
  id: 1,
  deckId: 1,
  front: "laufen",
  back: {
    type: "phrase",
    translation: "to run",
  },
  notes: "some note",
  version: 1,
  createdAt: "2026-01-17T19:01:09",
  updatedAt: "2026-01-17T19:01:09",
};
