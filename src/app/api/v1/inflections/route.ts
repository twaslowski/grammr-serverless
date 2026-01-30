import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { InflectionsRequestSchema } from "@/types/inflections";
import { getApiGatewayConfig } from "@/lib/api-gateway";

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
    const validationResult = InflectionsRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: z.flattenError(validationResult.error),
        },
        { status: 400 },
      );
    }

    const { lemma, pos, language } = validationResult.data;

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
  } catch (error) {
    console.error("Inflections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
