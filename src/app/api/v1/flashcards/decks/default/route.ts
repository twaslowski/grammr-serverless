import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/v1/flashcards/decks/default - Get the user's default deck
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: deck, error } = await supabase
      .from("deck")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();

    if (error || !deck) {
      return NextResponse.json(
        { error: "Default deck not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Default deck fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
