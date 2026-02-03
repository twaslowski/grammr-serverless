import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getApiGatewayConfig } from "@/lib/api-gateway";
import { createClient } from "@/lib/supabase/server";
import { MorphologyRequestSchema } from "@/types/morphology";

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
    const validationResult = MorphologyRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: z.flattenError(validationResult.error),
        },
        { status: 400 },
      );
    }

    const { phrase, language } = validationResult.data;

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
  } catch (error) {
    console.error("Morphology error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
