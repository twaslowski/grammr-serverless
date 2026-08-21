import { NextResponse } from "next/server";
import { z } from "zod";

import { callApiGateway, getApiGatewayConfig } from "@/lib/api/api-gateway";
import { withApiHandler } from "@/lib/api/with-api-handler";

const PreflightQuerySchema = z.object({
  language: z.string().min(1, "Language is required"),
});

const KEEP_WARM_BODY = { "keep-warm": "true" };

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

    // Checked up front: allSettled below would otherwise swallow the
    // not-configured error along with the warm-up failures we do want ignored.
    if (!getApiGatewayConfig()) {
      console.error("API_GW_URL or API_GW_API_KEY not configured");
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 },
      );
    }

    // Fire warm-up requests in parallel and ignore any errors
    await Promise.allSettled([
      callApiGateway(`/inflections/${language}`, KEEP_WARM_BODY),
      callApiGateway(`/morphology/${language}`, KEEP_WARM_BODY),
    ]);

    return NextResponse.json({ status: "ok" });
  },
);
