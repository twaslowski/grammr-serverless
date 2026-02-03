import { NextRequest, NextResponse } from "next/server";

import { getApiGatewayConfig } from "@/lib/api-gateway";
import { createClient } from "@/lib/supabase/server";

/**
 * Pre-flight endpoint to warm up image-based Lambda functions.
 * Sends requests to inflections and morphology endpoints to reduce cold start latency.
 */
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

    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get("language");

    if (!language) {
      return NextResponse.json(
        { error: "Language not specified" },
        { status: 400 },
      );
    }

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
  } catch (error) {
    console.error("Pre-flight error:", error);
    // Still return success since warmup is best-effort
    return NextResponse.json({ status: "ok" });
  }
}
