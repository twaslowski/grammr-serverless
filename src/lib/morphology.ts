import { createValidatedFetcher } from "@/lib/api/validated-fetcher";
import {
  EnrichedMorphologicalAnalysis,
  EnrichedToken,
  MorphologicalAnalysis,
  MorphologicalAnalysisSchema,
  MorphologyRequest,
} from "@/types/morphology";

const fetchMorphology = createValidatedFetcher(MorphologicalAnalysisSchema);

export async function analyzeMorphology(
  request: MorphologyRequest,
): Promise<MorphologicalAnalysis> {
  return fetchMorphology("/api/v1/morphology", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export const find = (
  token: string,
  morphologicalAnalysis: EnrichedMorphologicalAnalysis,
): EnrichedToken | undefined => {
  const result = morphologicalAnalysis.tokens.find(
    (t) => t.text.toLowerCase() === token.toLowerCase(),
  );

  if (!result) {
    console.warn(
      "could not find token for segment:",
      stripPunctuation(token),
      morphologicalAnalysis,
    );
  }

  return result;
};

export const stripPunctuation = (word: string): string => {
  return word.replace(/[^\p{L}\p{N}\p{Z}]/gu, "");
};
