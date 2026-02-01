import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getApiGatewayConfig } from "@/lib/api-gateway";
import {
  TranslationRequestSchema,
  TranslationResponseSchema,
} from "@/types/translation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiGwConfig = getApiGatewayConfig();
    if (!apiGwConfig) {
      console.error("API_GW_URL not configured");
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = TranslationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: z.flattenError(validationResult.error),
        },
        { status: 400 },
      );
    }

    // Forward to Lambda via API Gateway
    const response = await fetch(`${apiGwConfig.endpoint}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiGwConfig.apiKey,
      },
      body: JSON.stringify(validationResult.data),
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
  } catch (error) {
    console.error("Inflections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
