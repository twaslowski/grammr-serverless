import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiGatewayConfig } from "@/lib/api/api-gateway";
import { withApiHandler } from "@/lib/api/with-api-handler";

const PreflightQuerySchema = z.object({
  language: z.string().min(1, "Language is required"),
});

/**
 * Pre-flight endpoint to warm up image-based Lambda functions.
 * Sends requests to inflections and morphology endpoints to reduce cold start latency.
 */
export const POST = withApiHandler(
  {
    querySchema: PreflightQuerySchema,
  },
  async ({ query }) => {
    const { language } = query;

    const apiGwConfig = getApiGatewayConfig();
    if (!apiGwConfig) {
      console.error("API_GW_URL not configured");
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 },
      );
    }

    // Fire warm-up requests in parallel and ignore any errors
    const warmupPromises = [
      // Warm up Russian inflections Lambda
      fetch(`${apiGwConfig.endpoint}/inflections/${language}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiGwConfig.apiKey,
        },
        body: JSON.stringify({ "keep-warm": "true" }),
      }).catch(() => null),
      // Warm up morphology Lambda
      fetch(`${apiGwConfig.endpoint}/morphology/${language}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiGwConfig.apiKey,
        },
        body: JSON.stringify({ "keep-warm": "true" }),
      }).catch(() => null),
    ];

    await Promise.allSettled(warmupPromises);

    return NextResponse.json({ status: "ok" });
  },
);
