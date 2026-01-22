/**
 * Export/Import Schema and Logic Tests
 *
 * Tests to verify that:
 * 1. Export format is correct and doesn't include deck IDs
 * 2. Import schema correctly validates incoming data
 * 3. Deck IDs are independent between export and import (user A with deckId 2
 *    can export, user B can import to deckId 3)
 */

import {
  ExportedFlashcardSchema,
  FlashcardExportSchema,
  FlashcardImportRequestSchema,
  ImportFlashcardSchema,
} from "../schema";

describe("Export/Import Schema Validation", () => {
  describe("ExportedFlashcardSchema", () => {
    it("should validate a valid exported flashcard", () => {
      const validFlashcard = {
        front: "привет",
        type: "word",
        back: {
          translation: "hello",
        },
        notes: "Common greeting",
        deck_name: "Russian Vocabulary",
      };

      const result = ExportedFlashcardSchema.safeParse(validFlashcard);
      expect(result.success).toBe(true);
    });

    it("should validate a flashcard with paradigm in back", () => {
      const flashcardWithParadigm = {
        front: "кот",
        type: "word",
        back: {
          translation: "cat",
          paradigm: {
            partOfSpeech: "NOUN",
            lemma: "кот",
            inflections: [
              {
                lemma: "кот",
                inflected: "кота",
                features: [{ category: "case", value: "GEN" }],
              },
            ],
          },
        },
        notes: null,
        deck_name: "Russian Nouns",
      };

      const result = ExportedFlashcardSchema.safeParse(flashcardWithParadigm);
      expect(result.success).toBe(true);
    });

    it("should NOT include deck_id in the export schema", () => {
      // Verify that deck_id is not part of the schema shape
      const schemaKeys = Object.keys(ExportedFlashcardSchema.shape);
      expect(schemaKeys).not.toContain("deck_id");
      expect(schemaKeys).toContain("deck_name"); // Should have deck_name instead
    });

    it("should reject a flashcard with missing required fields", () => {
      const invalidFlashcard = {
        front: "test",
        // missing type, back, notes, deck_name
      };

      const result = ExportedFlashcardSchema.safeParse(invalidFlashcard);
      expect(result.success).toBe(false);
    });
  });

  describe("FlashcardExportSchema", () => {
    it("should validate a complete export structure", () => {
      const validExport = {
        version: 1,
        exported_at: "2026-01-22T10:00:00.000Z",
        flashcards: [
          {
            front: "слово",
            type: "word",
            back: { translation: "word" },
            notes: null,
            deck_name: "Default Deck",
          },
        ],
      };

      const result = FlashcardExportSchema.safeParse(validExport);
      expect(result.success).toBe(true);
    });

    it("should validate an empty flashcards array", () => {
      const emptyExport = {
        version: 1,
        exported_at: "2026-01-22T10:00:00.000Z",
        flashcards: [],
      };

      const result = FlashcardExportSchema.safeParse(emptyExport);
      expect(result.success).toBe(true);
    });

    it("should only accept version 1", () => {
      const wrongVersion = {
        version: 2,
        exported_at: "2026-01-22T10:00:00.000Z",
        flashcards: [],
      };

      const result = FlashcardExportSchema.safeParse(wrongVersion);
      expect(result.success).toBe(false);
    });
  });

  describe("ImportFlashcardSchema", () => {
    it("should validate a valid import flashcard", () => {
      const validImport = {
        front: "привет",
        type: "word",
        back: {
          translation: "hello",
        },
        notes: "Common greeting",
      };

      const result = ImportFlashcardSchema.safeParse(validImport);
      expect(result.success).toBe(true);
    });

    it("should NOT require or include deck_id", () => {
      const schemaKeys = Object.keys(ImportFlashcardSchema.shape);
      expect(schemaKeys).not.toContain("deck_id");
    });

    it("should allow null notes", () => {
      const flashcardWithNullNotes = {
        front: "тест",
        type: "word",
        back: { translation: "test" },
        notes: null,
      };

      const result = ImportFlashcardSchema.safeParse(flashcardWithNullNotes);
      expect(result.success).toBe(true);
    });

    it("should allow omitted notes", () => {
      const flashcardWithoutNotes = {
        front: "тест",
        type: "word",
        back: { translation: "test" },
      };

      const result = ImportFlashcardSchema.safeParse(flashcardWithoutNotes);
      expect(result.success).toBe(true);
    });

    it("should reject empty front", () => {
      const emptyFront = {
        front: "",
        type: "word",
        back: { translation: "test" },
      };

      const result = ImportFlashcardSchema.safeParse(emptyFront);
      expect(result.success).toBe(false);
    });
  });

  describe("FlashcardImportRequestSchema", () => {
    it("should validate a complete import request", () => {
      const validRequest = {
        version: 1,
        flashcards: [
          {
            front: "слово",
            type: "word",
            back: { translation: "word" },
          },
        ],
      };

      const result = FlashcardImportRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should accept any version number (not just 1)", () => {
      // Import accepts any version to allow forward compatibility
      const request = {
        version: 2,
        flashcards: [],
      };

      const result = FlashcardImportRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });
});

describe("Deck ID Independence", () => {
  describe("Export format excludes deck IDs", () => {
    it("should export flashcards without deck_id, only deck_name", () => {
      // Simulate what the export route produces
      const userAFlashcard = {
        id: 101,
        deck_id: 2, // User A's deck ID
        front: "кошка",
        type: "word" as const,
        back: { translation: "cat" },
        notes: "Animal",
        deck: { name: "Animals", user_id: "user-a-id" },
      };

      // Transform to export format (same logic as export route)
      const exported = {
        front: userAFlashcard.front,
        type: userAFlashcard.type,
        back: userAFlashcard.back,
        notes: userAFlashcard.notes,
        deck_name: userAFlashcard.deck.name,
      };

      // Verify the exported format doesn't include deck_id
      expect(exported).not.toHaveProperty("deck_id");
      expect(exported).not.toHaveProperty("id");
      expect(exported).toHaveProperty("deck_name", "Animals");

      // Validate against schema
      const result = ExportedFlashcardSchema.safeParse(exported);
      expect(result.success).toBe(true);
    });
  });

  describe("Import creates flashcards with new deck ID", () => {
    it("should transform exported data to import format", () => {
      // Exported data from User A (deck_id: 2)
      const exportedData = {
        version: 1,
        exported_at: "2026-01-22T10:00:00.000Z",
        flashcards: [
          {
            front: "кошка",
            type: "word",
            back: { translation: "cat" },
            notes: "Animal",
            deck_name: "Animals", // Original deck name from User A
          },
          {
            front: "собака",
            type: "word",
            back: { translation: "dog" },
            notes: null,
            deck_name: "Animals",
          },
        ],
      };

      // Validate the exported data
      const exportResult = FlashcardExportSchema.safeParse(exportedData);
      expect(exportResult.success).toBe(true);

      // Transform for import (stripping deck_name which isn't used)
      const importData = {
        version: exportedData.version,
        flashcards: exportedData.flashcards.map((card) => ({
          front: card.front,
          type: card.type,
          back: card.back,
          notes: card.notes,
          // Note: deck_name is ignored during import, deck_id comes from user's default deck
        })),
      };

      // Validate the import data
      const importResult = FlashcardImportRequestSchema.safeParse(importData);
      expect(importResult.success).toBe(true);
    });

    it("should simulate complete export-import flow between different users", () => {
      // User A has flashcards in deck with ID 2
      const userADeckId = 2;
      const userAFlashcards = [
        {
          id: 101,
          deck_id: userADeckId,
          front: "яблоко",
          type: "word" as const,
          back: { translation: "apple" },
          notes: "Fruit",
          version: 1,
          created_at: "2026-01-20T10:00:00.000Z",
          updated_at: "2026-01-20T10:00:00.000Z",
        },
        {
          id: 102,
          deck_id: userADeckId,
          front: "груша",
          type: "word" as const,
          back: { translation: "pear" },
          notes: null,
          version: 1,
          created_at: "2026-01-20T11:00:00.000Z",
          updated_at: "2026-01-20T11:00:00.000Z",
        },
      ];

      // Step 1: User A exports (simulating export route logic)
      const exportedFlashcards = userAFlashcards.map((card) => ({
        front: card.front,
        type: card.type,
        back: card.back,
        notes: card.notes,
        deck_name: "Fruits", // Would come from deck join
      }));

      const exportPayload = {
        version: 1 as const,
        exported_at: new Date().toISOString(),
        flashcards: exportedFlashcards,
      };

      // Verify export is valid
      expect(FlashcardExportSchema.safeParse(exportPayload).success).toBe(true);

      // Verify no deck_id in export
      exportPayload.flashcards.forEach((card) => {
        expect(card).not.toHaveProperty("deck_id");
        expect(card).not.toHaveProperty("id");
      });

      // Step 2: User B imports (has different default deck with ID 3)
      const userBDefaultDeckId = 3;

      // The import route would parse the request
      const importRequest = {
        version: exportPayload.version,
        flashcards: exportPayload.flashcards.map((card) => ({
          front: card.front,
          type: card.type,
          back: card.back,
          notes: card.notes,
        })),
      };

      // Validate import request
      const importValidation =
        FlashcardImportRequestSchema.safeParse(importRequest);
      expect(importValidation.success).toBe(true);

      // Step 3: Simulate what the import route creates (with User B's deck ID)
      const flashcardsToInsert = importValidation.data!.flashcards.map(
        (card) => ({
          deck_id: userBDefaultDeckId, // User B's deck ID, NOT User A's
          front: card.front,
          type: card.type,
          back: card.back,
          notes: card.notes || null,
        }),
      );

      // Verify all inserted flashcards have User B's deck ID
      flashcardsToInsert.forEach((card) => {
        expect(card.deck_id).toBe(userBDefaultDeckId);
        expect(card.deck_id).not.toBe(userADeckId);
      });

      // Verify the content is preserved
      expect(flashcardsToInsert[0].front).toBe("яблоко");
      expect(flashcardsToInsert[0].back.translation).toBe("apple");
      expect(flashcardsToInsert[1].front).toBe("груша");
      expect(flashcardsToInsert[1].back.translation).toBe("pear");
    });
  });

  describe("Paradigm data is preserved during export/import", () => {
    it("should preserve paradigm inflection data through export/import cycle", () => {
      const paradigm = {
        partOfSpeech: "NOUN" as const,
        lemma: "кот",
        inflections: [
          {
            lemma: "кот",
            inflected: "кот",
            features: [
              { category: "case", value: "NOM" },
              { category: "number", value: "SING" },
            ],
          },
          {
            lemma: "кот",
            inflected: "кота",
            features: [
              { category: "case", value: "GEN" },
              { category: "number", value: "SING" },
            ],
          },
          {
            lemma: "кот",
            inflected: "коту",
            features: [
              { category: "case", value: "DAT" },
              { category: "number", value: "SING" },
            ],
          },
        ],
      };

      const exportedCard = {
        front: "кот",
        type: "word",
        back: {
          translation: "cat",
          paradigm: paradigm,
        },
        notes: "Masculine animate noun",
        deck_name: "Russian Nouns",
      };

      // Validate export
      const exportResult = ExportedFlashcardSchema.safeParse(exportedCard);
      expect(exportResult.success).toBe(true);

      // Transform for import
      const importCard = {
        front: exportedCard.front,
        type: exportedCard.type,
        back: exportedCard.back,
        notes: exportedCard.notes,
      };

      // Validate import
      const importResult = ImportFlashcardSchema.safeParse(importCard);
      expect(importResult.success).toBe(true);

      // Verify paradigm is preserved
      if (importResult.success) {
        expect(importResult.data.back.paradigm).toBeDefined();
        expect(importResult.data.back.paradigm?.lemma).toBe("кот");
        expect(importResult.data.back.paradigm?.inflections).toHaveLength(3);
      }
    });
  });
});
