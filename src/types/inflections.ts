import { z } from "zod";

import { FeatureSchema } from "@/types/feature";
import { LanguageCodeSchema } from "@/types/languages";

// Part of Speech enum, defaults to X for unknown values
export const PartOfSpeechEnum = z
  .string()
  .pipe(
    z.enum([
      // Open class words
      "ADJ",
      "ADV",
      "INTJ",
      "NOUN",
      "PROPN",
      "VERB",
      // Closed class words
      "ADP",
      "AUX",
      "CCONJ",
      "DET",
      "NUM",
      "PART",
      "PRON",
      "SCONJ",
      // Other
      "PUNCT",
      "SYM",
      "X",
    ]),
  )
  .catch("X");
export type PartOfSpeech = z.infer<typeof PartOfSpeechEnum>;

/**
 * The parts of speech worth asking the inflection services about. Narrower than
 * what `paradigmLayout` (in `@/lib/inflections`) can render: it answers whether a
 * request is worth making at all, not how to lay the answer out.
 */
export const InflectablePosSet: Set<PartOfSpeech> = new Set([
  "ADJ",
  "NOUN",
  "AUX",
  "VERB",
]);

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
  // Inherent features of the lexeme itself, such as noun gender. Unlike the
  // features on an Inflection these classify the whole paradigm rather than a
  // single cell, so they are held here instead of repeated on every form.
  // Defaulted rather than required: paradigms persisted before this field
  // existed are still parsed out of `flashcard.back`.
  lemmaFeatures: z.array(FeatureSchema).default([]),
  inflections: z.array(InflectionSchema),
});
export type Paradigm = z.infer<typeof ParadigmSchema>;

// Row/column order for the inflection tables. The labels for these values live
// in `@/lib/feature-labels`, which is the single owner of feature display names.
export const CASE_ORDER = ["NOM", "GEN", "DAT", "ACC", "ABL", "LOC"] as const;

// Gender column order for adjectives, whose gender is inflectional
export const GENDER_ORDER = ["MASC", "FEM", "NEUT"] as const;

// Person display order for verb-like words
export const PERSON_ORDER = ["FIRST", "SECOND", "THIRD"] as const;
