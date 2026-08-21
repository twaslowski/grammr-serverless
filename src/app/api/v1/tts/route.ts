import { NextResponse } from "next/server";

import {
  apiGatewayNotConfiguredResponse,
  callApiGateway,
} from "@/lib/api/api-gateway";
import { withApiHandler } from "@/lib/api/with-api-handler";

import { TTSRequestSchema } from "./schema";

export const POST = withApiHandler(
  {
    bodySchema: TTSRequestSchema,
  },
  async ({ body }) => {
    let response: Response;
    try {
      response = await callApiGateway("/tts", body);
    } catch (error) {
      return apiGatewayNotConfiguredResponse(error);
    }

    if (!response.ok) {
      console.error("TTS Lambda error:", await response.text());
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
