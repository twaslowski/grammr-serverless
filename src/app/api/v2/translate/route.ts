import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { getApiGatewayConfig } from "@/lib/api-gateway";
import {
  TranslationRequestSchema,
  TranslationResponseSchema,
} from "@/types/translation";

export const POST = withApiHandler(
  {
    bodySchema: TranslationRequestSchema,
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

    // Forward to Lambda via API Gateway
    const response = await fetch(`${apiGwConfig.endpoint}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiGwConfig.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("API Gateway response error:", await response.text());
      return NextResponse.json(
        { error: "Translation service error" },
        { status: 502 },
      );
    }

    const responseData = await response.json();
    const parsed = TranslationResponseSchema.safeParse(responseData);

    if (!parsed.success) {
      console.error("Invalid response from translation service:", responseData);
      return NextResponse.json(
        { error: "Invalid response from translation service" },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed.data);
  },
);
