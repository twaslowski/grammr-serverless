import { z } from "zod";

import { FeatureSchema } from "@/types/feature";
import { ParadigmSchema, PartOfSpeechEnum } from "@/types/inflections";
import { LanguageCodeSchema } from "@/types/languages";

// Request schema
export const MorphologyRequestSchema = z.object({
  text: z.string().min(1),
  language: LanguageCodeSchema,
});

export type MorphologyRequest = z.infer<typeof MorphologyRequestSchema>;

export const TokenMorphologySchema = z.object({
  text: z.string(),
  lemma: z.string(),
  pos: PartOfSpeechEnum,
  features: z.array(FeatureSchema).default([]),
});
export type TokenMorphology = z.infer<typeof TokenMorphologySchema>;

export const MorphologicalAnalysisSchema = z.object({
  text: z.string(),
  language: LanguageCodeSchema,
  tokens: z.array(TokenMorphologySchema),
});
export type MorphologicalAnalysis = z.infer<typeof MorphologicalAnalysisSchema>;

export const EnrichedTokenSchema = TokenMorphologySchema.extend({
  paradigm: ParadigmSchema.optional(),
  translation: z.string().optional(),
});
export type EnrichedToken = z.infer<typeof EnrichedTokenSchema>;

export const EnrichedMorphologicalAnalysisSchema =
  MorphologicalAnalysisSchema.extend({
    tokens: z.array(EnrichedTokenSchema),
  });

export type EnrichedMorphologicalAnalysis = z.infer<
  typeof EnrichedMorphologicalAnalysisSchema
>;
