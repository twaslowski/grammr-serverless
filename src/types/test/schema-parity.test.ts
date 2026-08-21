/**
 * Guards the hand-written wire schemas in `src/types/*` against drift from the
 * Drizzle tables they describe.
 *
 * Those schemas are deliberately not derived with `drizzle-zod`, because
 * client components import them and the derivation drags the whole
 * `drizzle-orm/pg-core` table definition into the browser bundle. This test is
 * server-side only, so it can import both and compare them.
 */
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { decks, flashcards, profiles } from "@/db/schemas/schema";
import { DeckSchema } from "@/types/deck";
import { FlashcardBack, FlashcardSchema } from "@/types/flashcards";
import { ProfileSchema } from "@/types/profile";

const deckRow = {
  id: 1,
  name: "Russian Vocabulary",
  userId: "3f1e4b4e-9a1d-4f7a-9c1f-2b6a5d0e7c11",
  description: "Nouns and verbs",
  isDefault: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  visibility: "private",
  language: "ru",
};

const flashcardBack: FlashcardBack = {
  type: "phrase",
  translation: "hello",
};

const flashcardRow = {
  id: 7,
  deckId: 1,
  front: "привет",
  back: flashcardBack,
  notes: "Common greeting",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const profileRow = {
  id: "3f1e4b4e-9a1d-4f7a-9c1f-2b6a5d0e7c11",
  sourceLanguage: "en",
  targetLanguage: "ru",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("wire schemas match their Drizzle tables", () => {
  it.each([
    ["deck", DeckSchema, createSelectSchema(decks), deckRow],
    [
      "flashcard",
      FlashcardSchema,
      createSelectSchema(flashcards, { back: z.custom<FlashcardBack>() }),
      flashcardRow,
    ],
    ["profile", ProfileSchema, createSelectSchema(profiles), profileRow],
  ])("%s: accepts a representative row", (_name, wire, derived, row) => {
    expect(derived.safeParse(row).success).toBe(true);
    expect(wire.safeParse(row).success).toBe(true);
  });

  it.each([
    ["deck", DeckSchema, createSelectSchema(decks)],
    ["profile", ProfileSchema, createSelectSchema(profiles)],
  ])("%s: covers exactly the table's columns", (_name, wire, derived) => {
    const derivedKeys = Object.keys(
      (derived as z.ZodObject<z.ZodRawShape>).shape,
    );
    const wireKeys = Object.keys((wire as z.ZodObject<z.ZodRawShape>).shape);

    // The wire schema may add computed fields (e.g. deck.isStudying), but must
    // not omit a column.
    expect(wireKeys).toEqual(expect.arrayContaining(derivedKeys));
  });

  it("flashcard covers exactly the table's columns", () => {
    const derivedKeys = Object.keys(createSelectSchema(flashcards).shape);
    const wireKeys = Object.keys(FlashcardSchema.shape);

    expect(wireKeys).toEqual(expect.arrayContaining(derivedKeys));
  });

  it.each([
    ["deck", DeckSchema, { ...deckRow, id: "not-a-number" }],
    ["deck", DeckSchema, { ...deckRow, name: "x".repeat(256) }],
    ["flashcard", FlashcardSchema, { ...flashcardRow, front: 42 }],
    ["profile", ProfileSchema, { ...profileRow, targetLanguage: "klingon" }],
  ])("%s: rejects malformed input", (_name, wire, row) => {
    expect(wire.safeParse(row).success).toBe(false);
  });

  it("deck tolerates the nullable columns the table allows", () => {
    const parsed = DeckSchema.safeParse({
      ...deckRow,
      userId: null,
      description: null,
      isDefault: null,
    });

    expect(parsed.success).toBe(true);
    // isDefault is normalised from null to undefined for consumers.
    expect(parsed.success && parsed.data.isDefault).toBeUndefined();
  });
});
