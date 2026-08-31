import { z } from "zod";

import { PartOfSpeech } from "@/types/inflections";

/**
 * The languages a new profile is provisioned with.
 *
 * The UI only offers Russian, but the enum, `allLanguages` and every Lambda
 * stay multi-language: adding a language back is a matter of publishing an
 * artifact and surfacing it, not of widening the data model again.
 */
export const DEFAULT_SOURCE_LANGUAGE = "en" as const;
export const DEFAULT_TARGET_LANGUAGE = "ru" as const;

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
   * The inflection form it used to be distinguished from is gone, so this is
   * now simply the gate on offering a language at all. `inflectionConfig`
   * survives because the generators behind `/api/v1/inflections` are still the
   * dictionary's last-resort fallback for a word Wiktionary does not cover.
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
