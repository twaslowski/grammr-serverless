import {
  EnrichedMorphologicalAnalysis,
  EnrichedToken,
  MorphologicalAnalysis,
  MorphologicalAnalysisSchema,
  MorphologyRequest,
} from "@/types/morphology";

export async function analyzeMorphology(
  request: MorphologyRequest,
): Promise<MorphologicalAnalysis> {
  const response = await fetch("/api/v1/morphology", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to analyze morphology");
  }

  const parsed = MorphologicalAnalysisSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Invalid morphology response format");
  }
  return parsed.data;
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
