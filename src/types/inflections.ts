import { z } from "zod";
import { LanguageCodeSchema } from "@/types/languages";
import { FeatureSchema } from "@/types/feature";

// Part of Speech enum
export const PartOfSpeechEnum = z.enum([
    // Open class words
    "ADJ", "ADV", "INTJ", "NOUN", "PROPN", "VERB",
    // Closed class words
    "ADP", "AUX", "CCONJ", "DET", "NUM", "PART", "PRON", "SCONJ",
    // Other
    "PUNCT", "SYM", "X"
]);
export type PartOfSpeech = z.infer<typeof PartOfSpeechEnum>;

// Data structure for inflections request
export const InflectionsRequestSchema = z.object({
  lemma: z.string().min(1),
  pos: PartOfSpeechEnum,
  language: LanguageCodeSchema,
});
export type InflectionsRequest = z.infer<typeof InflectionsRequestSchema>;

// Represents a single inflection of a word, e.g. "cat" -> "cats"
export const InflectionSchema = z.object({
  lemma: z.string(),
  inflected: z.string(),
  features: z.array(FeatureSchema),
});
export type Inflection = z.infer<typeof InflectionSchema>;

// A linguistic paradigm is the complete set of related word forms associated with a given lexeme.
// Note that "lexeme" is not really part of the domain language, "lemma" is much more frequently used
// This might not be entirely accurate terminology, but it's close enough for now.
// https://en.wikipedia.org/wiki/Morphology_(linguistics)#Paradigms_and_morphosyntax
export const ParadigmSchema = z.object({
  partOfSpeech: PartOfSpeechEnum,
  lemma: z.string(),
  inflections: z.array(InflectionSchema),
});
export type Paradigm = z.infer<typeof ParadigmSchema>;

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
