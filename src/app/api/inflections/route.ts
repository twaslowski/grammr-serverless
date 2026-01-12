import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const INFLECTIONS_API_URL = process.env.INFLECTIONS_API_URL;

// Request schema for inflections
const InflectionsRequestSchema = z.object({
  word: z.string().min(1),
  language: z.string().min(2),
});

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

    if (!INFLECTIONS_API_URL) {
      console.error("INFLECTIONS_API_URL not configured");
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
        { error: "Invalid request", details: validationResult.error.flatten() },
        { status: 400 },
      );
    }

    // Forward to Lambda via API Gateway
    const response = await fetch(`${INFLECTIONS_API_URL}/inflections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validationResult.data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Inflections API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Inflections lookup failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Inflections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
