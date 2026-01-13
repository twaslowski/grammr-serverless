import { z } from "zod";

const PartOfSpeechEnum = z.enum(["NOUN", "ADJ", "VERB", "AUX"]);

export const FeatureSchema = z.object({
    type: z.enum(["CASE", "NUMBER", "GENDER", "PERSON", "TENSE"]),
    value: z.string(),
});
export type Feature = z.infer<typeof FeatureSchema>;