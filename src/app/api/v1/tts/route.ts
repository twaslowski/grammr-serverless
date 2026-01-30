import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TTSRequestSchema } from "./schema";
import { getApiGatewayConfig } from "@/lib/api-gateway";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiGwConfig = getApiGatewayConfig();

    if (!apiGwConfig) {
      console.error("API_GW_URL or API_GW_API_KEY not configured");
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = TTSRequestSchema.safeParse(body);

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
    const response = await fetch(`${apiGwConfig.endpoint}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiGwConfig.apiKey,
      },
      body: JSON.stringify(validationResult.data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TTS Lambda error:", errorText);
      return NextResponse.json(
        { error: "TTS service error" },
        { status: response.status },
      );
    }

    // Lambda returns base64 encoded audio with isBase64Encoded: true
    // API Gateway automatically decodes it, so we receive the raw audio
    const audioData = await response.arrayBuffer();

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="speech.mp3"',
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
