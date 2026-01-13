import { z } from "zod";
import { LanguageCodeSchema } from "@/types/languages";
import { FeatureSchema } from "@/types/language";

// Part of Speech enum
export const PartOfSpeechEnum = z.enum(["NOUN", "ADJ", "VERB", "AUX"]);
export type PartOfSpeech = z.infer<typeof PartOfSpeechEnum>;

// Request schema
export const InflectionsRequestSchema = z.object({
  lemma: z.string().min(1),
  pos: PartOfSpeechEnum,
  language: LanguageCodeSchema,
});
export type InflectionsRequest = z.infer<typeof InflectionsRequestSchema>;

// Inflection schema
export const InflectionSchema = z.object({
  lemma: z.string(),
  inflected: z.string(),
  features: z.array(FeatureSchema),
});
export type Inflection = z.infer<typeof InflectionSchema>;

// Response schema
export const InflectionsResponseSchema = z.object({
  partOfSpeech: PartOfSpeechEnum,
  lemma: z.string(),
  inflections: z.array(InflectionSchema),
});
export type InflectionsResponse = z.infer<typeof InflectionsResponseSchema>;

// Helper to check if POS is noun-like (NOUN, ADJ)
export function isNounLike(pos: string): boolean {
  return pos === "NOUN" || pos === "ADJ";
}

// Helper to check if POS is verb-like (VERB, AUX)
export function isVerbLike(pos: string): boolean {
  return pos === "VERB" || pos === "AUX";
}

// Case display order for noun-like words
export const CASE_ORDER = ["NOM", "GEN", "DAT", "ACC", "ABL", "LOC"] as const;

// Case labels
export const CASE_LABELS: Record<string, string> = {
  NOM: "Nominative",
  GEN: "Genitive",
  DAT: "Dative",
  ACC: "Accusative",
  ABL: "Instrumental",
  LOC: "Prepositional",
};

// Person display order for verb-like words
export const PERSON_ORDER = ["FIRST", "SECOND", "THIRD"] as const;

// Person labels
export const PERSON_LABELS: Record<string, string> = {
  FIRST: "1st Person",
  SECOND: "2nd Person",
  THIRD: "3rd Person",
};
