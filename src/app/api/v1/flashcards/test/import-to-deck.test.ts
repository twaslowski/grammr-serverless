/**
 * Import to Deck Tests
 *
 * Tests to verify that flashcards can be imported to a specific deck by ID.
 */

import { FlashcardImportRequestSchema } from "../schema";

describe("Import flashcards to specific deck", () => {
  describe("Import with deckId", () => {
    it("should accept import request with deckId", () => {
      const importRequest = {
        version: "1.0",
        deckId: 1,
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
        expect(result.data.deckId).toBe(1);
      }
    });

    /**
     * The UI has no deck picker any more, so it sends no `deckId` and the route
     * resolves the caller's default deck. An explicit id is still accepted for
     * anything scripted against the API.
     */
    it("should accept import request without deckId", () => {
      const importRequest = {
        version: "1.0",
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
        expect(result.data.deckId).toBeUndefined();
      }
    });

    it("should accept import request with multiple flashcards", () => {
      const importRequest = {
        version: "1.0",
        deckId: 2,
        flashcards: [
          {
            front: "bonjour",
            back: {
              type: "phrase",
              translation: "hello",
            },
            notes: "Common greeting",
          },
          {
            front: "merci",
            back: {
              type: "phrase",
              translation: "thank you",
            },
            notes: null,
          },
        ],
      };

      const result = FlashcardImportRequestSchema.safeParse(importRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deckId).toBe(2);
        expect(result.data.flashcards).toHaveLength(2);
      }
    });
  });
});
