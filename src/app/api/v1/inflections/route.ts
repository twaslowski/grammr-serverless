import { NextResponse } from "next/server";

import { getApiGatewayConfig } from "@/lib/api/api-gateway";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { InflectionsRequestSchema } from "@/types/inflections";

export const POST = withApiHandler(
  {
    bodySchema: InflectionsRequestSchema,
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

    const { lemma, pos, language } = body;

    // Forward to Lambda via API Gateway with language-specific endpoint
    const response = await fetch(
      `${apiGwConfig.endpoint}/inflections/${language}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiGwConfig.apiKey,
        },
        body: JSON.stringify({ lemma, pos }),
      },
    );

    // Parse response body
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse response:", responseText);
      return NextResponse.json(
        { error: "Invalid response from inflections service" },
        { status: 500 },
      );
    }

    if (!response.ok) {
      console.error("Inflections API error:", response.status, responseData);

      // Handle 400 errors (user errors like low confidence or POS mismatch)
      if (response.status === 400) {
        return NextResponse.json(
          {
            error:
              responseData.error ||
              "Could not inflect the provided word. Please check the word and part of speech.",
          },
          { status: 400 },
        );
      }

      // Handle other errors
      return NextResponse.json(
        { error: responseData.error || "Inflections lookup failed" },
        { status: response.status },
      );
    }

    return NextResponse.json(responseData);
  },
);
