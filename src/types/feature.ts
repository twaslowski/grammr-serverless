import { z } from "zod";

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
