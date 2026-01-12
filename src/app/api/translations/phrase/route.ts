import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { PhraseTranslationRequestSchema } from "@/types/translation";

const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const FUNCTION_NAME = "phrase-translation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const jwt = session.access_token;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = PhraseTranslationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.message },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${SUPABASE_PROJECT_URL}/functions/v1/${FUNCTION_NAME}`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + jwt,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      },
    );

    // Handle error cases
    if (response.status !== 200) {
      const error = await response.json();
      console.error("Edge function error:", response.status);
      return NextResponse.json(
        { error: error || "Translation failed" },
        { status: 500 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Phrase translation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
