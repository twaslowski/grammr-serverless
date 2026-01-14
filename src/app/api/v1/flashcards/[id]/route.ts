import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { UpdateFlashcardRequestSchema } from "@/types/flashcards";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/flashcards/[id] - Get a single flashcard
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

    const flashcardId = parseInt(id, 10);
    if (isNaN(flashcardId)) {
      return NextResponse.json(
        { error: "Invalid flashcard ID" },
        { status: 400 },
      );
    }

    const { data: flashcard, error } = await supabase
      .from("flashcard")
      .select(
        `
        *,
        deck!inner (
          id,
          name,
          user_id
        )
      `,
      )
      .eq("id", flashcardId)
      .eq("deck.user_id", user.id)
      .single();

    if (error || !flashcard) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...flashcard,
      deck: { id: flashcard.deck.id, name: flashcard.deck.name },
    });
  } catch (error) {
    console.error("Flashcard get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/v1/flashcards/[id] - Update a flashcard
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

    const flashcardId = parseInt(id, 10);
    if (isNaN(flashcardId)) {
      return NextResponse.json(
        { error: "Invalid flashcard ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validationResult = UpdateFlashcardRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.flatten() },
        { status: 400 },
      );
    }

    // Verify ownership first
    const { data: existing, error: existingError } = await supabase
      .from("flashcard")
      .select(
        `
        id,
        deck!inner (
          user_id
        )
      `,
      )
      .eq("id", flashcardId)
      .eq("deck.user_id", user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    // If updating deck_id, verify new deck ownership
    if (validationResult.data.deck_id) {
      const { data: newDeck, error: deckError } = await supabase
        .from("deck")
        .select("id")
        .eq("id", validationResult.data.deck_id)
        .eq("user_id", user.id)
        .single();

      if (deckError || !newDeck) {
        return NextResponse.json(
          { error: "Target deck not found or access denied" },
          { status: 404 },
        );
      }
    }

    const { data: flashcard, error } = await supabase
      .from("flashcard")
      .update({
        ...validationResult.data,
        version: existing.id, // Increment version on update
      })
      .eq("id", flashcardId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update flashcard:", error);
      return NextResponse.json(
        { error: "Failed to update flashcard" },
        { status: 500 },
      );
    }

    return NextResponse.json(flashcard);
  } catch (error) {
    console.error("Flashcard update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/v1/flashcards/[id] - Delete a flashcard
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

    const flashcardId = parseInt(id, 10);
    if (isNaN(flashcardId)) {
      return NextResponse.json(
        { error: "Invalid flashcard ID" },
        { status: 400 },
      );
    }

    // Verify ownership first
    const { data: existing, error: existingError } = await supabase
      .from("flashcard")
      .select(
        `
        id,
        deck!inner (
          user_id
        )
      `,
      )
      .eq("id", flashcardId)
      .eq("deck.user_id", user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from("flashcard")
      .delete()
      .eq("id", flashcardId);

    if (error) {
      console.error("Failed to delete flashcard:", error);
      return NextResponse.json(
        { error: "Failed to delete flashcard" },
        { status: 500 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Flashcard delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
