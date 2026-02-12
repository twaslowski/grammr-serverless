import {
  enrichWithParadigms,
  getParadigm,
  InflectionError,
} from "@/lib/inflections";
import { Paradigm } from "@/types/inflections";
import { MorphologicalAnalysis } from "@/types/morphology";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("inflections", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("InflectionError", () => {
    it("should create user error with correct properties", () => {
      const error = new InflectionError("User error message", true);
      expect(error.message).toBe("User error message");
      expect(error.isUserError).toBe(true);
      expect(error.name).toBe("InflectionError");
    });

    it("should create system error with correct properties", () => {
      const error = new InflectionError("System error message", false);
      expect(error.message).toBe("System error message");
      expect(error.isUserError).toBe(false);
      expect(error.name).toBe("InflectionError");
    });

    it("should default to system error when isUserError not specified", () => {
      const error = new InflectionError("Default error");
      expect(error.isUserError).toBe(false);
    });
  });

  describe("getParadigm", () => {
    const validParadigm: Paradigm = {
      partOfSpeech: "NOUN",
      lemma: "кот",
      inflections: [
        {
          lemma: "кот",
          inflected: "кот",
          features: [
            { type: "CASE", value: "NOM" },
            { type: "NUMBER", value: "SING" },
          ],
        },
        {
          lemma: "кот",
          inflected: "кота",
          features: [
            { type: "CASE", value: "GEN" },
            { type: "NUMBER", value: "SING" },
          ],
        },
      ],
    };

    it("should fetch and return a valid paradigm", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validParadigm,
      });

      const result = await getParadigm({
        lemma: "кот",
        pos: "NOUN",
        language: "ru",
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/v1/inflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lemma: "кот",
          pos: "NOUN",
          language: "ru",
        }),
      });
      expect(result).toEqual(validParadigm);
    });

    it("should throw user error for 400 status with custom message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Word not found" }),
      });

      try {
        await getParadigm({
          lemma: "invalid",
          pos: "NOUN",
          language: "ru",
        });
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(InflectionError);
        expect((error as InflectionError).message).toBe("Word not found");
        expect((error as InflectionError).isUserError).toBe(true);
      }
    });

    it("should throw user error for 400 status with default message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      try {
        await getParadigm({
          lemma: "invalid",
          pos: "NOUN",
          language: "ru",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InflectionError);
        expect((error as InflectionError).message).toContain(
          "Could not inflect the provided word",
        );
        expect((error as InflectionError).isUserError).toBe(true);
      }
    });

    it("should throw system error for non-400 status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      try {
        await getParadigm({
          lemma: "кот",
          pos: "NOUN",
          language: "ru",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InflectionError);
        expect((error as InflectionError).message).toBe(
          "Internal server error",
        );
        expect((error as InflectionError).isUserError).toBe(false);
      }
    });

    it("should throw system error for invalid response format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "response" }),
      });

      try {
        await getParadigm({
          lemma: "кот",
          pos: "NOUN",
          language: "ru",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InflectionError);
        expect((error as InflectionError).message).toBe(
          "Invalid response from server",
        );
        expect((error as InflectionError).isUserError).toBe(false);
      }
    });
  });

  describe("enrichWithParadigms", () => {
    const mockNounParadigm: Paradigm = {
      partOfSpeech: "NOUN",
      lemma: "кот",
      inflections: [
        {
          lemma: "кот",
          inflected: "кот",
          features: [
            { type: "CASE", value: "NOM" },
            { type: "NUMBER", value: "SING" },
          ],
        },
      ],
    };

    const mockVerbParadigm: Paradigm = {
      partOfSpeech: "VERB",
      lemma: "идти",
      inflections: [
        {
          lemma: "идти",
          inflected: "иду",
          features: [
            { type: "PERSON", value: "FIRST" },
            { type: "NUMBER", value: "SING" },
          ],
        },
      ],
    };

    it("should enrich tokens with paradigms for inflectable POS", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "Кот идёт",
        language: "ru",
        tokens: [
          {
            text: "Кот",
            lemma: "кот",
            pos: "NOUN",
            features: [
              { type: "CASE", value: "NOM" },
              { type: "NUMBER", value: "SING" },
            ],
          },
          {
            text: "идёт",
            lemma: "идти",
            pos: "VERB",
            features: [
              { type: "PERSON", value: "THIRD" },
              { type: "NUMBER", value: "SING" },
            ],
          },
        ],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockNounParadigm,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVerbParadigm,
        });

      const result = await enrichWithParadigms(morphologicalAnalysis, "ru");

      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].paradigm).toEqual(mockNounParadigm);
      expect(result.tokens[1].paradigm).toEqual(mockVerbParadigm);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should not add paradigm to non-inflectable POS", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "Кот и собака",
        language: "ru",
        tokens: [
          {
            text: "Кот",
            lemma: "кот",
            pos: "NOUN",
            features: [],
          },
          {
            text: "и",
            lemma: "и",
            pos: "CCONJ",
            features: [],
          },
          {
            text: "собака",
            lemma: "собака",
            pos: "NOUN",
            features: [],
          },
        ],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockNounParadigm,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockNounParadigm,
            lemma: "собака",
          }),
        });

      const result = await enrichWithParadigms(morphologicalAnalysis, "ru");

      expect(result.tokens).toHaveLength(3);
      expect(result.tokens[0].paradigm).toBeDefined();
      expect(result.tokens[1].paradigm).toBeUndefined();
      expect(result.tokens[2].paradigm).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle empty tokens array", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "",
        language: "ru",
        tokens: [],
      };

      const result = await enrichWithParadigms(morphologicalAnalysis, "ru");

      expect(result.tokens).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle analysis with no inflectable tokens", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "и или",
        language: "ru",
        tokens: [
          {
            text: "и",
            lemma: "и",
            pos: "CCONJ",
            features: [],
          },
          {
            text: "или",
            lemma: "или",
            pos: "CCONJ",
            features: [],
          },
        ],
      };

      const result = await enrichWithParadigms(morphologicalAnalysis, "ru");

      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].paradigm).toBeUndefined();
      expect(result.tokens[1].paradigm).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should continue enriching other tokens if one paradigm fetch fails", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "Кот идёт",
        language: "ru",
        tokens: [
          {
            text: "Кот",
            lemma: "кот",
            pos: "NOUN",
            features: [],
          },
          {
            text: "идёт",
            lemma: "идти",
            pos: "VERB",
            features: [],
          },
        ],
      };

      // First call fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: "Word not found" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVerbParadigm,
        });

      // Mock console.warn to verify it's called
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await enrichWithParadigms(morphologicalAnalysis, "ru");

      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].paradigm).toBeUndefined();
      expect(result.tokens[1].paradigm).toEqual(mockVerbParadigm);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch paradigm for "кот"'),
        expect.any(String),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle all inflectable POS types", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "Test",
        language: "en",
        tokens: [
          {
            text: "adjective",
            lemma: "adjective",
            pos: "ADJ",
            features: [],
          },
          {
            text: "noun",
            lemma: "noun",
            pos: "NOUN",
            features: [],
          },
          {
            text: "aux",
            lemma: "aux",
            pos: "AUX",
            features: [],
          },
          {
            text: "verb",
            lemma: "verb",
            pos: "VERB",
            features: [],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockNounParadigm,
      });

      const result = await enrichWithParadigms(morphologicalAnalysis, "ru");

      expect(result.tokens).toHaveLength(4);
      expect(mockFetch).toHaveBeenCalledTimes(4);
      result.tokens.forEach((token) => {
        expect(token.paradigm).toBeDefined();
      });
    });

    it("should preserve original morphological analysis structure", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "Test phrase",
        language: "ru",
        tokens: [
          {
            text: "Test",
            lemma: "test",
            pos: "NOUN",
            features: [
              { type: "CASE", value: "NOM" },
              { type: "NUMBER", value: "SING" },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNounParadigm,
      });

      const result = await enrichWithParadigms(morphologicalAnalysis, "ru");

      expect(result.text).toBe(morphologicalAnalysis.text);
      expect(result.tokens[0].text).toBe(morphologicalAnalysis.tokens[0].text);
      expect(result.tokens[0].lemma).toBe(
        morphologicalAnalysis.tokens[0].lemma,
      );
      expect(result.tokens[0].pos).toBe(morphologicalAnalysis.tokens[0].pos);
      expect(result.tokens[0].features).toEqual(
        morphologicalAnalysis.tokens[0].features,
      );
    });

    it("should handle network errors gracefully", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "Кот",
        language: "ru",
        tokens: [
          {
            text: "Кот",
            lemma: "кот",
            pos: "NOUN",
            features: [],
          },
        ],
      };

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await enrichWithParadigms(morphologicalAnalysis, "ru");

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].paradigm).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should fetch paradigms in parallel for better performance", async () => {
      const morphologicalAnalysis: MorphologicalAnalysis = {
        text: "Test",
        language: "en",
        tokens: [
          { text: "word1", lemma: "word1", pos: "NOUN", features: [] },
          { text: "word2", lemma: "word2", pos: "VERB", features: [] },
          { text: "word3", lemma: "word3", pos: "ADJ", features: [] },
        ],
      };

      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        callCount++;
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          ok: true,
          json: async () => mockNounParadigm,
        };
      });

      const startTime = Date.now();
      await enrichWithParadigms(morphologicalAnalysis, "ru");
      const duration = Date.now() - startTime;

      // If calls were sequential, it would take 30ms+
      // If parallel, should be closer to 10ms
      expect(duration).toBeLessThan(25);
      expect(callCount).toBe(3);
    });
  });
});
