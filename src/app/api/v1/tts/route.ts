import { NextResponse } from "next/server";

import { getApiGatewayConfig } from "@/lib/api/api-gateway";
import { withApiHandler } from "@/lib/api/with-api-handler";

import { TTSRequestSchema } from "./schema";

export const POST = withApiHandler(
  {
    bodySchema: TTSRequestSchema,
  },
  async ({ body }) => {
    const apiGwConfig = getApiGatewayConfig();

    if (!apiGwConfig) {
      console.error("API_GW_URL or API_GW_API_KEY not configured");
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 },
      );
    }

    // Forward to Lambda via API Gateway
    const response = await fetch(`${apiGwConfig.endpoint}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiGwConfig.apiKey,
      },
      body: JSON.stringify(body),
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
  },
);
