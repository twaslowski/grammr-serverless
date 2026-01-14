import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { UpdateDeckRequestSchema } from "@/types/flashcards";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/flashcards/decks/[id] - Get a single deck with its flashcards
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const { data: deck, error } = await supabase
      .from("deck")
      .select(
        `
        *,
        flashcard (
          id,
          front,
          type,
          back,
          notes,
          created_at,
          updated_at
        )
      `,
      )
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single();

    if (error || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Deck get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/v1/flashcards/decks/[id] - Update a deck
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = UpdateDeckRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.flatten() },
        { status: 400 },
      );
    }

    // Verify ownership first
    const { data: existing, error: existingError } = await supabase
      .from("deck")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const { data: deck, error } = await supabase
      .from("deck")
      .update(validationResult.data)
      .eq("id", deckId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update deck:", error);
      return NextResponse.json(
        { error: "Failed to update deck" },
        { status: 500 },
      );
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Deck update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/v1/flashcards/decks/[id] - Delete a deck
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    // Verify ownership and check if it's the default deck
    const { data: existing, error: existingError } = await supabase
      .from("deck")
      .select("id, is_default")
      .eq("id", deckId)
      .eq("user_id", user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (existing.is_default) {
      return NextResponse.json(
        { error: "Cannot delete the default deck" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("deck").delete().eq("id", deckId);

    if (error) {
      console.error("Failed to delete deck:", error);
      return NextResponse.json(
        { error: "Failed to delete deck" },
        { status: 500 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Deck delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
