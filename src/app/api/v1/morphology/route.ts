import { NextResponse } from "next/server";

import { getApiGatewayConfig } from "@/lib/api/api-gateway";
import { createValidatedFetcher } from "@/lib/api/validated-fetcher";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { LanguageCodeSchema } from "@/types/languages";
import {
  MorphologicalAnalysis,
  MorphologicalAnalysisSchema,
  MorphologyRequestSchema,
} from "@/types/morphology";

/**
 * POST /api/v1/morphology
 * Body: MorphologyRequest { phrase: string, language: string }
 * Response: MorphologicalAnalysis { sourcePhrase: string, tokens: TokenMorphology[] }
 *
 * This endpoint forwards the request to the morphology API Gateway endpoint and passes back the response.
 * Called at src/lib/morphology.ts.
 */

// Do not require language code in response.
// Instead, the response is enriched with the requested language code before returning to client.
const responseSchema = MorphologicalAnalysisSchema.extend({
  language: LanguageCodeSchema.optional(),
});

export const POST = withApiHandler(
  {
    bodySchema: MorphologyRequestSchema,
    requireAuth: false,
  },
  async ({ body }) => {
    const apiGwConfig = getApiGatewayConfig();
    if (!apiGwConfig) {
      console.error("API_GW_URL not configured");
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 },
      );
    }

    const { text, language } = body;

    const fetchMorphology = createValidatedFetcher(responseSchema);
    const response = await fetchMorphology(
      `${apiGwConfig.endpoint}/morphology/${language}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiGwConfig.apiKey,
        },
        body: JSON.stringify({ text: text }),
      },
    ).catch((error) => {
      console.error("Morphology API error:", error);
      throw new Error("Morphology analysis failed");
    });

    const enrichedResponse: MorphologicalAnalysis = {
      ...response,
      language: language,
    };

    return NextResponse.json(enrichedResponse);
  },
);
