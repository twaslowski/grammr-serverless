import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { getApiGatewayConfig } from "@/lib/api-gateway";
import { MorphologyRequestSchema } from "@/types/morphology";

export const POST = withApiHandler(
  {
    bodySchema: MorphologyRequestSchema,
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

    const { phrase, language } = body;

    // Forward to Lambda via API Gateway
    const response = await fetch(
      `${apiGwConfig.endpoint}/morphology/${language}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiGwConfig.apiKey,
        },
        body: JSON.stringify({ phrase: phrase }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Morphology API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Morphology analysis failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  },
);
