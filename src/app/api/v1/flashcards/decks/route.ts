import { NextResponse } from "next/server";

import { CreateDeckRequestSchema } from "@/app/api/v1/flashcards/schema";
import { withApiHandler } from "@/lib/api/with-api-handler";

// GET /api/v1/flashcards/decks - List all decks for the user
export const GET = withApiHandler({}, async ({ user, supabase }) => {
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
