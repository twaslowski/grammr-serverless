import { z } from "zod";

export const FALLBACK_FEATURE_TYPE = "OTHER";

/**
 * The grammatical dimensions the app understands.
 *
 * The two NLP services disagree on casing — the inflection services emit
 * `"CASE"`, the morphology service emits spaCy's `"case"` — so the type is
 * normalised on the way in. Anything outside this list becomes `OTHER` and is
 * dropped before display.
 *
 * The list past `TENSE` is what the morphology service actually sends for
 * Russian (see `docs/samples/*.json`); before they were admitted here, every
 * one of them was silently discarded.
 */
export const FEATURE_TYPES = [
  // Core axes: the dimensions an inflection table is pivoted on.
  "CASE",
  "NUMBER",
  "GENDER",
  "PERSON",
  "TENSE",
  // Additional axes reported per token by morphological analysis.
  "ASPECT",
  "MOOD",
  "VOICE",
  "ANIMACY",
  "DEGREE",
  "VERBFORM",
  "POLARITY",
  FALLBACK_FEATURE_TYPE,
] as const;

export const FeatureTypeEnum = z.enum(FEATURE_TYPES);
export type FeatureType = z.infer<typeof FeatureTypeEnum>;

export const FeatureTypes = z
  .string()
  .transform((val) => val.toUpperCase())
  .pipe(FeatureTypeEnum)
  .catch(FALLBACK_FEATURE_TYPE);

export const FeatureSchema = z.object({
  type: FeatureTypes,
  value: z.string(),
});
export type Feature = z.infer<typeof FeatureSchema>;
