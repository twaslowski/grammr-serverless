import { Deck, Flashcard } from "@/types/flashcards";

export const flashcardFixture: Flashcard = {
  id: 1,
  deck_id: 1,
  front: "laufen",
  back: {
    type: "phrase",
    translation: "to run",
  },
  notes: "some note",
  version: 1,
  created_at: "2026-01-17T19:01:09",
  updated_at: "2026-01-17T19:01:09",
};

export const deckFixture: Deck = {
  id: 1,
  name: "German Verbs",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  description: "A deck of common German verbs",
  created_at: "2026-01-17T19:00:00",
  updated_at: "2026-01-17T19:00:00",
  visibility: "private",
  is_default: true,
};
