import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { CreateDeckRequestSchema } from "@/types/flashcards";

// GET /api/v1/flashcards/decks - List all decks for the user
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

    const { data: decks, error } = await supabase
      .from("deck")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch decks:", error);
      return NextResponse.json(
        { error: "Failed to fetch decks" },
        { status: 500 },
      );
    }

    return NextResponse.json(decks);
  } catch (error) {
    console.error("Decks list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/v1/flashcards/decks - Create a new deck
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = CreateDeckRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.flatten() },
        { status: 400 },
      );
    }

    const { name, description } = validationResult.data;

    const { data: deck, error } = await supabase
      .from("deck")
      .insert({
        name,
        description: description || null,
        user_id: user.id,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create deck:", error);
      return NextResponse.json(
        { error: "Failed to create deck" },
        { status: 500 },
      );
    }

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error("Deck creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
