import {
  Language,
  LanguageCode,
  sourceLanguages,
  targetLanguages,
} from "@/types/languages";

export function getLanguageByCode(code: LanguageCode): Language | undefined {
  return [...targetLanguages, ...sourceLanguages].find((l) => l.code === code);
}
