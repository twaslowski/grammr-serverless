import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  CreateFlashcardRequestSchema,
  FlashcardListQuerySchema,
} from "./schema";
import { z } from "zod";

// GET /api/v1/flashcards - List flashcards with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const queryResult = FlashcardListQuerySchema.safeParse({
      deck_id: searchParams.get("deck_id"),
      search: searchParams.get("search"),
      sort_by: searchParams.get("sort_by"),
      sort_order: searchParams.get("sort_order"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: queryResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { deck_id, search, sort_by, sort_order } = queryResult.data;

    // Build query - join with deck to filter by user ownership
    let query = supabase
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
      .eq("deck.user_id", user.id);

    // Filter by deck if specified
    if (deck_id) {
      query = query.eq("deck_id", deck_id);
    }

    if (search) {
      query = query.or(
        `front.ilike.%${search}%,back->>translation.ilike.%${search}%`,
      );
    }

    // Sort
    query = query.order(sort_by || "created_at", {
      ascending: sort_order === "asc",
    });

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch flashcards:", error);
      return NextResponse.json(
        { error: "Failed to fetch flashcards" },
        { status: 500 },
      );
    }

    // Transform to include deck info
    const flashcards = data.map((item) => ({
      ...item,
      deck: item.deck ? { id: item.deck.id, name: item.deck.name } : undefined,
    }));

    return NextResponse.json(flashcards);
  } catch (error) {
    console.error("Flashcards list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/v1/flashcards - Create a new flashcard
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
    const validationResult = CreateFlashcardRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: z.flattenError(validationResult.error),
        },
        { status: 400 },
      );
    }

    const { deck_id, front, back, notes } = validationResult.data;

    // If no deck_id provided, get the user's default deck
    let targetDeckId = deck_id;
    if (!targetDeckId) {
      const { data: defaultDeck, error: deckError } = await supabase
        .from("deck")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();

      if (deckError || !defaultDeck) {
        return NextResponse.json(
          { error: "No default deck found. Please create a deck first." },
          { status: 400 },
        );
      }
      targetDeckId = defaultDeck.id;
    } else {
      // Verify the deck belongs to the user
      const { data: deck, error: deckError } = await supabase
        .from("deck")
        .select("id")
        .eq("id", targetDeckId)
        .eq("user_id", user.id)
        .single();

      if (deckError || !deck) {
        return NextResponse.json(
          { error: "Deck not found or access denied" },
          { status: 404 },
        );
      }
    }

    const { data: flashcard, error } = await supabase
      .from("flashcard")
      .insert({
        deck_id: targetDeckId,
        front,
        back,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create flashcard:", error);
      return NextResponse.json(
        { error: "Failed to create flashcard" },
        { status: 500 },
      );
    }

    return NextResponse.json(flashcard, { status: 201 });
  } catch (error) {
    console.error("Flashcard creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
