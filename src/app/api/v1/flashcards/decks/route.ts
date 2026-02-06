import { NextResponse } from "next/server";

import { CreateDeckRequestSchema } from "@/app/api/v1/flashcards/schema";
import { withApiHandler } from "@/lib/api/with-api-handler";

// GET /api/v1/flashcards/decks - List all decks the user owns or studies
export const GET = withApiHandler({}, async ({ user, supabase }) => {
    // First, get active deck IDs from deck_study
    const { data: deckStudies } = await supabase
        .from("deck_study")
        .select("deck_id")
        .eq("user_id", user.id)
        .eq("is_active", true);

    const deckStudyIds = deckStudies?.map(ds => ds.deck_id) || [];

    // Then query decks with OR condition
    const { data: decks, error } = await supabase
        .from("deck")
        .select("*")
        .or(`user_id.eq.${user.id},id.in.(${deckStudyIds.join(",")})`)
        .order("created_at", { ascending: false });


    if (error) {
    console.error("Failed to fetch decks:", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 },
    );
  }

  return NextResponse.json(decks);
});

// POST /api/v1/flashcards/decks - Create a new deck
export const POST = withApiHandler(
  {
    bodySchema: CreateDeckRequestSchema,
  },
  async ({ user, supabase, body }) => {
    const { name, description } = body;

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
  },
);
