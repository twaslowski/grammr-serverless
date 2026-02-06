import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";
import { UpdateFlashcardRequestSchema } from "../schema";

// GET /api/v1/flashcards/[id] - Get a single flashcard
export const GET = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, supabase, params }) => {
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
      .eq("id", params.id)
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
  },
);

// PATCH /api/v1/flashcards/[id] - Update a flashcard
export const PATCH = withApiHandler(
  {
    paramsSchema: IdParamSchema,
    bodySchema: UpdateFlashcardRequestSchema,
  },
  async ({ user, supabase, params, body }) => {
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
      .eq("id", params.id)
      .eq("deck.user_id", user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    // If updating deck_id, verify new deck ownership
    if (body.deck_id) {
      const { data: newDeck, error: deckError } = await supabase
        .from("deck")
        .select("id")
        .eq("id", body.deck_id)
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
        ...body,
        version: existing.id, // Increment version on update
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update flashcard:", error);
      return NextResponse.json(
        { error: "Failed to update flashcard" },
        { status: 500 },
      );
    }

    revalidatePath(`/dashboard/flashcards`);
    revalidatePath(`/flashcards/${params.id}`);

    return NextResponse.json(flashcard);
  },
);

// DELETE /api/v1/flashcards/[id] - Delete a flashcard
export const DELETE = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, supabase, params }) => {
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
      .eq("id", params.id)
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
      .eq("id", params.id);

    if (error) {
      console.error("Failed to delete flashcard:", error);
      return NextResponse.json(
        { error: "Failed to delete flashcard" },
        { status: 500 },
      );
    }

    revalidatePath(`/dashboard/flashcards`);
    revalidatePath(`/flashcards/${params.id}`);

    return new NextResponse(null, { status: 204 });
  },
);
