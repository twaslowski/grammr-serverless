import { NextResponse } from "next/server";

import {
  apiGatewayNotConfiguredResponse,
  callApiGateway,
} from "@/lib/api/api-gateway";
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
    const { text, language } = body;

    let response: Response;
    try {
      response = await callApiGateway(`/morphology/${language}`, { text });
    } catch (error) {
      return apiGatewayNotConfiguredResponse(error);
    }

    if (!response.ok) {
      console.error("Morphology API error:", await response.text());
      return NextResponse.json(
        { error: "Morphology analysis failed" },
        { status: 502 },
      );
    }

    const parsed = responseSchema.safeParse(await response.json());

    if (!parsed.success) {
      console.error("Invalid response from morphology service:", parsed.error);
      return NextResponse.json(
        { error: "Invalid response from morphology service" },
        { status: 502 },
      );
    }

    const enrichedResponse: MorphologicalAnalysis = {
      ...parsed.data,
      language,
    };

    return NextResponse.json(enrichedResponse);
  },
);
