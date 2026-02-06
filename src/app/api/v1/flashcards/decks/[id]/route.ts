import { NextResponse } from "next/server";

import { UpdateDeckRequestSchema } from "@/app/api/v1/flashcards/schema";
import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";

// GET /api/v1/flashcards/decks/[id] - Get a single deck with its flashcards
export const GET = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, supabase, params }) => {
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
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json(deck);
  },
);

// PATCH /api/v1/flashcards/decks/[id] - Update a deck
export const PATCH = withApiHandler(
  {
    paramsSchema: IdParamSchema,
    bodySchema: UpdateDeckRequestSchema,
  },
  async ({ user, supabase, params, body }) => {
    // Verify ownership first
    const { data: existing, error: existingError } = await supabase
      .from("deck")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const { data: deck, error } = await supabase
      .from("deck")
      .update(body)
      .eq("id", params.id)
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
  },
);

// DELETE /api/v1/flashcards/decks/[id] - Delete a deck
export const DELETE = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, supabase, params }) => {
    // Verify ownership and check if it's the default deck
    const { data: existing, error: existingError } = await supabase
      .from("deck")
      .select("id, is_default")
      .eq("id", params.id)
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

    const { error } = await supabase.from("deck").delete().eq("id", params.id);

    if (error) {
      console.error("Failed to delete deck:", error);
      return NextResponse.json(
        { error: "Failed to delete deck" },
        { status: 500 },
      );
    }

    return new NextResponse(null, { status: 204 });
  },
);
