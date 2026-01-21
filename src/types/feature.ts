import { z } from "zod";
import {
  getFeatureValueLabel,
  getFeatureTypeLabel,
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
