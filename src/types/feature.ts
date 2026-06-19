import { z } from "zod";

import {
  getFeatureTypeLabel,
  getFeatureValueLabel,
} from "@/lib/feature-labels";

export const FALLBACK_FEATURE_TYPE = "OTHER";

export const FeatureTypes = z
  .string()
  .transform((val) => val.toUpperCase())
  .pipe(
    z.enum([
      "CASE",
      "NUMBER",
      "GENDER",
      "PERSON",
      "TENSE",
      FALLBACK_FEATURE_TYPE,
    ]),
  )
  .catch(FALLBACK_FEATURE_TYPE);

export const FeatureSchema = z.object({
  type: FeatureTypes,
  value: z.string(),
});
export type Feature = z.infer<typeof FeatureSchema>;

const NOUN_FEATURE_ORDER = ["CASE", "NUMBER", "GENDER"];
const VERB_FEATURE_ORDER = ["PERSON", "NUMBER", "TENSE"];

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

export function isNounLike(pos: string): boolean {
  return pos === "NOUN" || pos === "ADJ";
}

export function isVerbLike(pos: string): boolean {
  return pos === "VERB" || pos === "AUX";
}

export function getOrderedFeatures(
  features: Feature[],
  pos: string,
): Feature[] {
  const filtered = features.filter((f) => f.type !== FALLBACK_FEATURE_TYPE);
  const order = isNounLike(pos)
    ? NOUN_FEATURE_ORDER
    : isVerbLike(pos)
      ? VERB_FEATURE_ORDER
      : [];

  if (order.length === 0) return filtered;

  const ordered: Feature[] = [];
  for (const type of order) {
    const f = filtered.find((f) => f.type === type);
    if (f) ordered.push(f);
  }
  // Append any remaining features not in the order
  for (const f of filtered) {
    if (!order.includes(f.type)) ordered.push(f);
  }
  return ordered;
}
