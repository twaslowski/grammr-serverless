import { z } from "zod";

export const LanguageCodeSchema = z.enum(["en", "ru", "it", "fr", "es", "pt"]);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

// Languages available for learning (target languages)
export const targetLanguages: Language[] = [
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
];

// Languages available as source (native) languages
// For now, only English is supported
export const sourceLanguages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
];
