import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const API_GW_URL = process.env.API_GW_URL;

/**
 * Pre-flight endpoint to warm up image-based Lambda functions.
 * Sends requests to inflections and morphology endpoints to reduce cold start latency.
 */
export async function POST() {
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

    if (!API_GW_URL) {
      console.error("API_GW_URL not configured");
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 503 },
      );
    }

    // Fire warm-up requests in parallel and ignore any errors
    const warmupPromises = [
      // Warm up Russian inflections Lambda
      fetch(`${API_GW_URL}/inflections/ru`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "keep-warm": "true" }),
      }).catch(() => null),
      // Warm up morphology Lambda
      fetch(`${API_GW_URL}/morphology`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
