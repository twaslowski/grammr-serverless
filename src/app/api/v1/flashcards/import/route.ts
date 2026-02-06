import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { FlashcardImportRequestSchema } from "../schema";

// POST /api/v1/flashcards/import - Import flashcards to a specified deck or default deck
export const POST = withApiHandler(
  {
    bodySchema: FlashcardImportRequestSchema,
  },
  async ({ user, supabase, body }) => {
    const { flashcards, deck_name, language, visibility } = body;

    if (flashcards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards to import" },
        { status: 400 },
      );
    }

    let targetDeckId: number;

    if (deck_name) {
      // Check if a deck with this name already exists for the user
      const { data: existingDeck } = await supabase
        .from("deck")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", deck_name)
        .single();

      if (existingDeck) {
        // Use existing deck
        targetDeckId = existingDeck.id;
      } else {
        // Create a new deck with the provided name
        const { data: newDeck, error: createDeckError } = await supabase
          .from("deck")
          .insert({
            name: deck_name,
            user_id: user.id,
            language: language,
            visibility: visibility || "private",
            is_default: false,
          })
          .select("id")
          .single();

        if (createDeckError || !newDeck) {
          console.error("Failed to create deck:", createDeckError);
          return NextResponse.json(
            { error: "Failed to create new deck" },
            { status: 500 },
          );
        }

        targetDeckId = newDeck.id;
      }
    } else {
      // No deck name provided, use default deck
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
    }

    // Prepare flashcards for insertion
    const flashcardsToInsert = flashcards.map((card) => ({
      deck_id: targetDeckId,
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
  },
);
