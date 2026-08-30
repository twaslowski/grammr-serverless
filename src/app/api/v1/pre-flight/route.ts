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
    // The dictionary is the one that most needs this: its cold start includes
    // pulling a SQLite artifact out of S3, and its warm-up handler primes that
    // rather than returning early, so this request pays the cost instead of a
    // reader's first lookup. A language with no published artifact answers 404
    // here, which allSettled discards along with the rest.
    await Promise.allSettled([
      callApiGateway(`/dictionary/${language}`, KEEP_WARM_BODY),
      callApiGateway(`/inflections/${language}`, KEEP_WARM_BODY),
      callApiGateway(`/morphology/${language}`, KEEP_WARM_BODY),
    ]);

    return NextResponse.json({ status: "ok" });
  },
);
