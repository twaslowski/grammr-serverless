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
