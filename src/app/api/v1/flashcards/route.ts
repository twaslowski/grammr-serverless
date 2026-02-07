import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { FlashcardWithDeck } from "@/types/flashcards";

import {
  CreateFlashcardRequestSchema,
  FlashcardListQuerySchema,
} from "./schema";

// GET /api/v1/flashcards - List flashcards with optional filtering
export const GET = withApiHandler(
  {
    querySchema: FlashcardListQuerySchema,
  },
  async ({ user, supabase, query }) => {
    const { deck_id, search, sort_by, sort_order } = query;

    // Build query - join with deck_study to filter by decks the user is studying
    // This includes both owned decks and public decks they're studying
    let dbQuery = supabase
      .from("flashcard")
      .select(
        `
        *,
        deck!inner (
          id,
          name,
          user_id,
          deck_study!inner (
            user_id
          )
        )
      `,
      )
      .eq("deck.deck_study.user_id", user.id);

    // Filter by deck if specified
    if (deck_id) {
      dbQuery = dbQuery.eq("deck_id", deck_id);
    }

    if (search) {
      dbQuery = dbQuery.or(
        `front.ilike.%${search}%,back->>translation.ilike.%${search}%`,
      );
    }

    // Sort
    dbQuery = dbQuery.order(sort_by || "created_at", {
      ascending: sort_order === "asc",
    });

    const { data, error } = await dbQuery;

    if (error) {
      console.error("Failed to fetch flashcards:", error);
      return NextResponse.json(
        { error: "Failed to fetch flashcards" },
        { status: 500 },
      );
    }

    // Transform to include deck info
    const flashcards = data.map((fc: FlashcardWithDeck) => ({
      ...fc,
      deck: fc.deck
        ? { id: fc.deck.id, name: fc.deck.name, userId: fc.deck.userId }
        : undefined,
    }));

    return NextResponse.json(flashcards);
  },
);

// POST /api/v1/flashcards - Create a new flashcard
export const POST = withApiHandler(
  {
    bodySchema: CreateFlashcardRequestSchema,
  },
  async ({ user, supabase, body }) => {
    const { deck_id, front, back, notes } = body;

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
  },
);
