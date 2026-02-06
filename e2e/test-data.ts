import { LanguageCode } from "@/types/languages";

export interface LanguageTestData {
  code: LanguageCode;
  name: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  inflections: {
    distinguishPos?: boolean;
    noun?: {
      word: string;
      expectedCases: string[];
    };
    verb?: {
      word: string;
      expectedPersons: string[];
    };
    adjective?: {
      word: string;
      expectedCases: string[];
    };
  };
  translations: {
    sampleSentence: string;
    expectedWords: string[];
  };
  invalidWord: string;
}

/**
 * Test data for each target language.
 * Each language has specific test cases with valid words and expected results.
 */
export const languageTestData: Record<LanguageCode, LanguageTestData> = {
  ru: {
    code: "ru",
    name: "Russian",
    sourceLanguage: "de",
    targetLanguage: "ru",
    inflections: {
      distinguishPos: true,
      noun: {
        word: "кот",
        expectedCases: [
          "Nominative",
          "Genitive",
          "Dative",
          "Accusative",
          "Instrumental",
          "Prepositional",
        ],
      },
      verb: {
        word: "читать",
        expectedPersons: ["1st Person", "2nd Person", "3rd Person"],
      },
      adjective: {
        word: "красный",
        expectedCases: [
          "Nominative",
          "Genitive",
          "Dative",
          "Accusative",
          "Instrumental",
          "Prepositional",
        ],
      },
    },
    translations: {
      sampleSentence: "Я читаю книгу",
      expectedWords: ["Я", "читаю", "книгу"],
    },
    invalidWord: "xyz123",
  },
  it: {
    code: "it",
    name: "Italian",
    sourceLanguage: "en",
    targetLanguage: "it",
    inflections: {
      distinguishPos: false,
      verb: {
        word: "essere",
        expectedPersons: ["1st Person", "2nd Person", "3rd Person"],
      },
    },
    translations: {
      sampleSentence: "Io leggo un libro",
      expectedWords: ["Io", "leggo", "un", "libro"],
    },
    invalidWord: "xyz123",
  },
  fr: {
    code: "fr",
    name: "French",
    sourceLanguage: "en",
    targetLanguage: "fr",
    inflections: {
      distinguishPos: false,
      verb: {
        word: "être",
        expectedPersons: ["1st Person", "2nd Person", "3rd Person"],
      },
    },
    translations: {
      sampleSentence: "Je lis un livre",
      expectedWords: ["Je", "lis", "un", "livre"],
    },
    invalidWord: "xyz123",
  },
  es: {
    code: "es",
    name: "Spanish",
    sourceLanguage: "en",
    targetLanguage: "es",
    inflections: {
      distinguishPos: false,
      verb: {
        word: "ser",
        expectedPersons: ["1st Person", "2nd Person", "3rd Person"],
      },
    },
    translations: {
      sampleSentence: "Yo leo un libro",
      expectedWords: ["Yo", "leo", "un", "libro"],
    },
    invalidWord: "xyz123",
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    sourceLanguage: "en",
    targetLanguage: "pt",
    inflections: {
      distinguishPos: false,
      verb: {
        word: "ser",
        expectedPersons: ["1st Person", "2nd Person", "3rd Person"],
      },
    },
    translations: {
      sampleSentence: "Eu leio um livro",
      expectedWords: ["Eu", "leio", "um", "livro"],
    },
    invalidWord: "xyz123",
  },
  // English and German are source languages, not target languages for learning
  en: {
    code: "en",
    name: "English",
    sourceLanguage: "en",
    targetLanguage: "ru", // Default pairing for testing
    inflections: {},
    translations: {
      sampleSentence: "I read a book",
      expectedWords: ["I", "read", "a", "book"],
    },
    invalidWord: "xyz123",
  },
  de: {
    code: "de",
    name: "German",
    sourceLanguage: "de",
    targetLanguage: "ru", // Default pairing for testing
    inflections: {},
    translations: {
      sampleSentence: "Ich lese ein Buch",
      expectedWords: ["Ich", "lese", "ein", "Buch"],
    },
    invalidWord: "xyz123",
  },
};

/**
 * Target languages that can be learned (excludes English and German which are typically source languages)
 */
export const testTargetLanguages: LanguageCode[] = ["ru", "it", "fr", "es", "pt"];

/**
 * Get test data for a specific language
 */
export function getTestData(language: LanguageCode): LanguageTestData {
  const data = languageTestData[language];
  if (!data) {
    throw new Error(`No test data available for language: ${language}`);
  }
  return data;
}

/**
 * Generate a test email for a specific language
 */
export function generateTestEmail(language: LanguageCode, uuid: string): string {
  return `user+${language}+${uuid}@grammr.app`;
}

