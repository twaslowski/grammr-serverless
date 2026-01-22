import {
  allLanguages,
  Language,
  LanguageCode,
} from "@/types/languages";

export function getLanguageByCode(code: LanguageCode): Language | undefined {
  return allLanguages.find((l) => l.code === code);
}
