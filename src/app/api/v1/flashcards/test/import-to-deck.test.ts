/**
 * Import to Deck Tests
 *
 * Tests to verify that flashcards can be imported to:
 * 1. An existing deck (by name)
 * 2. A new deck (created with the provided name)
 * 3. The default deck (when no deck name is provided)
 */

import { FlashcardImportRequestSchema } from "../schema";

describe("Import flashcards to specific deck", () => {
  describe("Import with deck_name", () => {
    it("should accept import request with deck_name", () => {
      const importRequest = {
        version: "1.0",
        deck_name: "Spanish Vocabulary",
        language: "es",
        visibility: "private",
        flashcards: [
          {
            front: "hola",
            back: {
              type: "phrase",
              translation: "hello",
            },
            notes: null,
          },
        ],
      };

      const result = FlashcardImportRequestSchema.safeParse(importRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deck_name).toBe("Spanish Vocabulary");
      }
    });

    it("should accept import request without deck_name (use default deck)", () => {
      const importRequest = {
        version: "1.0",
        language: "ru",
        flashcards: [
          {
            front: "привет",
            back: {
              type: "phrase",
              translation: "hello",
            },
            notes: null,
          },
        ],
      };

      const result = FlashcardImportRequestSchema.safeParse(importRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deck_name).toBeUndefined();
      }
    });

    it("should accept visibility field", () => {
      const importRequest = {
        version: "1.0",
        deck_name: "Public Phrases",
        language: "fr",
        visibility: "public",
        flashcards: [
          {
            front: "bonjour",
            back: {
              type: "phrase",
              translation: "hello",
            },
            notes: "Common greeting",
          },
        ],
      };

      const result = FlashcardImportRequestSchema.safeParse(importRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe("public");
      }
    });
  });
});
