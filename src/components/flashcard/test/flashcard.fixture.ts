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

/** A paradigm card: two inflected forms behind the disclosure. */
export const wordFlashcardFixture: Flashcard = {
  id: 2,
  deckId: 1,
  front: "стол",
  back: {
    type: "word",
    translation: "table",
    paradigm: {
      partOfSpeech: "NOUN",
      lemma: "стол",
      lemmaFeatures: [],
      inflections: [
        { lemma: "стол", inflected: "стола", features: [] },
        { lemma: "стол", inflected: "столу", features: [] },
      ],
    },
  },
  notes: null,
  version: 1,
  createdAt: "2026-01-17T19:01:09",
  updatedAt: "2026-01-17T19:01:09",
};

/** An analysis card: a per-token breakdown behind the disclosure. */
export const analysisFlashcardFixture: Flashcard = {
  id: 3,
  deckId: 1,
  front: "я читаю",
  back: {
    type: "analysis",
    translation: "I am reading",
    text: "я читаю",
    language: "ru",
    tokens: [
      { text: "я", lemma: "я", pos: "PRON", features: [] },
      { text: "читаю", lemma: "читать", pos: "VERB", features: [] },
    ],
  },
  notes: null,
  version: 1,
  createdAt: "2026-01-17T19:01:09",
  updatedAt: "2026-01-17T19:01:09",
};
