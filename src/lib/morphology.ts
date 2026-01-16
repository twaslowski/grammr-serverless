import {
  MorphologyRequest,
  MorphologicalAnalysis,
  MorphologicalAnalysisSchema,
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
