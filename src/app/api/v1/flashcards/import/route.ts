import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { FlashcardImportRequestSchema } from "../schema";

// POST /api/v1/flashcards/import - Import flashcards to the default deck
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
    const validationResult = FlashcardImportRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid import data",
          details: z.flattenError(validationResult.error),
        },
        { status: 400 },
      );
    }

    const { flashcards } = validationResult.data;

    if (flashcards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards to import" },
        { status: 400 },
      );
    }

    // Get the user's default deck
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

    // Prepare flashcards for insertion
    const flashcardsToInsert = flashcards.map((card) => ({
      deck_id: defaultDeck.id,
      front: card.front,
      back: card.back,
      notes: card.notes || null,
    }));

    // Insert all flashcards in a single batch
    const { data: insertedFlashcards, error: insertError } = await supabase
      .from("flashcard")
      .insert(flashcardsToInsert)
      .select();

    if (insertError) {
      console.error("Failed to import flashcards:", insertError);
      return NextResponse.json(
        { error: "Failed to import flashcards" },
        { status: 500 },
      );
    }

    revalidatePath("/dashboard/flashcards");

    return NextResponse.json({
      message: "Flashcards imported successfully",
      imported_count: insertedFlashcards.length,
    });
  } catch (error) {
    console.error("Flashcard import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
