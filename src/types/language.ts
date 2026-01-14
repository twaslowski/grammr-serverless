import { z } from "zod";

export const FeatureSchema = z.object({
  type: z.enum(["CASE", "NUMBER", "GENDER", "PERSON", "TENSE"]),
  value: z.string(),
});
export type Feature = z.infer<typeof FeatureSchema>;
