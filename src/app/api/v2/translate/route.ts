import { NextResponse } from "next/server";

import {
  apiGatewayNotConfiguredResponse,
  callApiGateway,
} from "@/lib/api/api-gateway";
import { withApiHandler } from "@/lib/api/with-api-handler";
import {
  TranslationRequestSchema,
  TranslationResponseSchema,
} from "@/types/translation";

export const POST = withApiHandler(
  {
    bodySchema: TranslationRequestSchema,
  },
  async ({ body }) => {
    let response: Response;
    try {
      response = await callApiGateway("/translate", body);
    } catch (error) {
      return apiGatewayNotConfiguredResponse(error);
    }

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
