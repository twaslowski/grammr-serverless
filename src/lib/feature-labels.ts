/**
 * How grammatical features are presented: the raw values the NLP services send
 * (spaCy universal-dependency tags, pymorphy3 tags, verbecc labels) mapped to
 * names a learner can read, plus the ordering rules the UI relies on.
 *
 * This is the single owner of those strings. `src/types/feature.ts` stays pure
 * schema so the wire format has no opinion about display.
 */
import { Feature, FeatureType } from "@/types/feature";

// Part of Speech labels (Universal Dependencies tags)
// See: https://universaldependencies.org/u/pos/
export const POS_LABELS: Record<string, string> = {
  // Open class words
  ADJ: "Adjective",
  ADV: "Adverb",
  INTJ: "Interjection",
  NOUN: "Noun",
  PROPN: "Proper Noun",
  VERB: "Verb",

  // Closed class words
  ADP: "Adposition",
  AUX: "Auxiliary",
  CCONJ: "Coordinating Conjunction",
  DET: "Determiner",
  NUM: "Numeral",
  PART: "Particle",
  PRON: "Pronoun",
  SCONJ: "Subordinating Conjunction",

  // Other
  PUNCT: "Punctuation",
  SYM: "Symbol",
  X: "Other",
};

// Case labels
export const CASE_VALUE_LABELS: Record<string, string> = {
  NOM: "Nominative",
  NOMN: "Nominative",
  GEN: "Genitive",
  GENT: "Genitive",
  DAT: "Dative",
  DATV: "Dative",
  ACC: "Accusative",
  ACCS: "Accusative",
  ABL: "Instrumental",
  ABLT: "Instrumental",
  INS: "Instrumental",
  LOC: "Prepositional",
  LOCT: "Prepositional",
  PREP: "Prepositional",
  VOC: "Vocative",
};

// Number labels
export const NUMBER_VALUE_LABELS: Record<string, string> = {
  SING: "Singular",
  SG: "Singular",
  PLUR: "Plural",
  PL: "Plural",
};

// Gender labels
export const GENDER_VALUE_LABELS: Record<string, string> = {
  MASC: "Masculine",
  M: "Masculine",
  FEM: "Feminine",
  FEMN: "Feminine",
  F: "Feminine",
  NEUT: "Neuter",
  N: "Neuter",
};

// Person labels
export const PERSON_VALUE_LABELS: Record<string, string> = {
  "1": "1st Person",
  "2": "2nd Person",
  "3": "3rd Person",
  FIRST: "1st Person",
  "1PER": "1st Person",
  SECOND: "2nd Person",
  "2PER": "2nd Person",
  THIRD: "3rd Person",
  "3PER": "3rd Person",
};

// Tense labels
export const TENSE_VALUE_LABELS: Record<string, string> = {
  PAST: "Past",
  PRES: "Present",
  FUT: "Future",
  FUTR: "Future",
  IMP: "Imperfect",
  PERF: "Perfect",
};

// Aspect labels
export const ASPECT_VALUE_LABELS: Record<string, string> = {
  IMP: "Imperfective",
  IMPF: "Imperfective",
  PERF: "Perfective",
  PRF: "Perfective",
};

// Mood labels
export const MOOD_VALUE_LABELS: Record<string, string> = {
  IND: "Indicative",
  IMP: "Imperative",
  COND: "Conditional",
  SUB: "Subjunctive",
};

// Voice labels
export const VOICE_VALUE_LABELS: Record<string, string> = {
  ACT: "Active",
  PASS: "Passive",
  MID: "Middle",
};

// Animacy labels
export const ANIMACY_VALUE_LABELS: Record<string, string> = {
  ANIM: "Animate",
  INAN: "Inanimate",
};

// Degree labels
export const DEGREE_VALUE_LABELS: Record<string, string> = {
  POS: "Positive",
  CMP: "Comparative",
  SUP: "Superlative",
};

// Verb form labels
export const VERBFORM_VALUE_LABELS: Record<string, string> = {
  FIN: "Finite",
  INF: "Infinitive",
  PART: "Participle",
  CONV: "Adverbial participle",
  GER: "Gerund",
};

// Polarity labels
export const POLARITY_VALUE_LABELS: Record<string, string> = {
  NEG: "Negative",
  POS: "Affirmative",
};

// Feature type labels (for the type itself)
export const FEATURE_TYPE_LABELS: Record<string, string> = {
  CASE: "Case",
  NUMBER: "Number",
  GENDER: "Gender",
  PERSON: "Person",
  TENSE: "Tense",
  ASPECT: "Aspect",
  MOOD: "Mood",
  VOICE: "Voice",
  ANIMACY: "Animacy",
  DEGREE: "Degree",
  VERBFORM: "Verb form",
  POLARITY: "Polarity",
  OTHER: "Other",
};

/**
 * Get a human-readable label for a feature value based on its type.
 *
 * @param type - The feature type (e.g., "CASE", "NUMBER")
 * @param value - The feature value (e.g., "SING", "NOM")
 * @returns A human-readable label, or the original value if no mapping exists
 */
export function getFeatureValueLabel(type: string, value: string): string {
  const normalizedValue = value.toUpperCase();
  const normalizedType = type.toUpperCase();

  switch (normalizedType) {
    case "CASE":
      return CASE_VALUE_LABELS[normalizedValue] || value;
    case "NUMBER":
      return NUMBER_VALUE_LABELS[normalizedValue] || value;
    case "GENDER":
      return GENDER_VALUE_LABELS[normalizedValue] || value;
    case "PERSON":
      return PERSON_VALUE_LABELS[normalizedValue] || value;
    case "TENSE":
      return TENSE_VALUE_LABELS[normalizedValue] || value;
    case "ASPECT":
      return ASPECT_VALUE_LABELS[normalizedValue] || value;
    case "MOOD":
      return MOOD_VALUE_LABELS[normalizedValue] || value;
    case "VOICE":
      return VOICE_VALUE_LABELS[normalizedValue] || value;
    case "ANIMACY":
      return ANIMACY_VALUE_LABELS[normalizedValue] || value;
    case "DEGREE":
      return DEGREE_VALUE_LABELS[normalizedValue] || value;
    case "VERBFORM":
      return VERBFORM_VALUE_LABELS[normalizedValue] || value;
    case "POLARITY":
      return POLARITY_VALUE_LABELS[normalizedValue] || value;
    default:
      return value;
  }
}

/**
 * Get a human-readable label for a feature type.
 *
 * @param type - The feature type (e.g., "CASE", "NUMBER")
 * @returns A human-readable label for the type
 */
export function getFeatureTypeLabel(type: string): string {
  const normalizedType = type.toUpperCase();
  return FEATURE_TYPE_LABELS[normalizedType] || type;
}

/**
 * Get a human-readable label for a part of speech tag.
 *
 * @param pos - The POS tag (e.g., "NOUN", "VERB", "ADJ")
 * @returns A human-readable label for the POS tag
 */
export function getPosLabel(pos: string): string {
  const normalizedPos = pos.toUpperCase();
  return POS_LABELS[normalizedPos] || pos;
}

/**
 * Get the human-readable display name for a feature value.
 */
export function getFeatureDisplayValue(feature: Feature): string {
  return getFeatureValueLabel(feature.type, feature.value);
}

/**
 * Get the human-readable display name for a feature type.
 */
export function getFeatureDisplayType(feature: Feature): string {
  return getFeatureTypeLabel(feature.type);
}

/**
 * The axes an inflection table is pivoted on. Their values ("Nominative",
 * "Plural") name the grammatical category unambiguously on their own.
 */
const CORE_FEATURE_TYPES = new Set<FeatureType>([
  "CASE",
  "NUMBER",
  "GENDER",
  "PERSON",
  "TENSE",
]);

/**
 * A feature as a single label.
 *
 * Core axes read fine as a bare value; the rest do not — "Positive" alone could
 * be a degree or a polarity — so those are qualified with their type.
 */
export function getFeatureDisplayLabel(feature: Feature): string {
  const value = getFeatureDisplayValue(feature);

  return CORE_FEATURE_TYPES.has(feature.type)
    ? value
    : `${getFeatureDisplayType(feature)}: ${value}`;
}

/**
 * Display order for a token's features.
 *
 * One canonical order rather than a per-part-of-speech one: it reproduces the
 * case/number/gender reading for nouns and person/number/tense for verbs, while
 * staying deterministic for tokens carrying both — which matters because the
 * inflection services build their feature lists from Python sets, so the array
 * arrives in arbitrary order.
 */
const FEATURE_TYPE_ORDER: FeatureType[] = [
  "CASE",
  "PERSON",
  "NUMBER",
  "GENDER",
  "TENSE",
  "ASPECT",
  "MOOD",
  "VOICE",
  "VERBFORM",
  "DEGREE",
  "ANIMACY",
  "POLARITY",
];

export function getOrderedFeatures(features: Feature[]): Feature[] {
  return features
    .filter((feature) => FEATURE_TYPE_ORDER.includes(feature.type))
    .sort(
      (a, b) =>
        FEATURE_TYPE_ORDER.indexOf(a.type) - FEATURE_TYPE_ORDER.indexOf(b.type),
    );
}
