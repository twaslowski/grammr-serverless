import { z } from "zod";
import { FeatureSchema } from "@/types/feature";

// Request schema
export const MorphologyRequestSchema = z.object({
  phrase: z.string().min(1),
});

export type MorphologyRequest = z.infer<typeof MorphologyRequestSchema>;

export const TokenMorphologySchema = z.object({
  text: z.string(),
  lemma: z.string(),
  pos: z.string(),
  features: z.array(FeatureSchema).default([]),
});
export type TokenMorphology = z.infer<typeof TokenMorphologySchema>;

export const MorphologicalAnalysisSchema = z.object({
  source_phrase: z.string(),
  tokens: z.array(TokenMorphologySchema),
});
export type MorphologicalAnalysis = z.infer<typeof MorphologicalAnalysisSchema>;
