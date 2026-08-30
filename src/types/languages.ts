import { z } from "zod";

import { PartOfSpeech } from "@/types/inflections";

export const LanguageCodeSchema = z.enum([
  "en",
  "ru",
  "it",
  "fr",
  "es",
  "pt",
  "de",
]);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

interface InflectionConfig {
  enabled: boolean;
  distinguishPos: boolean;
  pos: PartOfSpeech[];
}

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  inflectionConfig?: InflectionConfig;
  /**
   * Whether a dictionary artifact is published for this language.
   *
   * Kept separate from `inflectionConfig` rather than folded into it. That config
   * exists to drive the part-of-speech picker on the inflection form, and the
   * dictionary has no picker to drive -- asking the reader to classify a word
   * before looking it up is the thing being removed. The two will converge once
   * the inflection form is retired.
   */
  dictionaryEnabled?: boolean;
}

export const allLanguages: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    dictionaryEnabled: true,
    inflectionConfig: {
      enabled: true,
      pos: ["NOUN", "ADJ", "VERB", "AUX"],
      distinguishPos: true,
    },
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    inflectionConfig: {
      enabled: true,
      pos: ["VERB"],
      distinguishPos: false,
    },
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    inflectionConfig: {
      enabled: true,
      pos: ["VERB"],
      distinguishPos: false,
    },
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    inflectionConfig: {
      enabled: true,
      pos: ["VERB"],
      distinguishPos: false,
    },
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    inflectionConfig: {
      enabled: true,
      pos: ["VERB"],
      distinguishPos: false,
    },
  },
];

export const targetLanguages: Language[] = allLanguages.filter(
  (lang) => lang.code !== "en" && lang.code !== "de",
);
