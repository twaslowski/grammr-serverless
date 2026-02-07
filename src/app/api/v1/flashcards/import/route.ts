import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { decks, flashcards as flashcardsTable } from "@/db/schemas";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { FlashcardImportRequestSchema } from "../schema";

// POST /api/v1/flashcards/import - Import flashcards to a specified deck or default deck
export const POST = withApiHandler(
  {
    bodySchema: FlashcardImportRequestSchema,
  },
  async ({ user, body }) => {
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
      const existingDeck = await db
        .select()
        .from(decks)
        .where(and(eq(decks.name, deck_name), eq(decks.userId, user.id)))
        .limit(1);

      if (existingDeck.length > 0) {
        // Use existing deck
        targetDeckId = existingDeck[0].id;
      } else {
        // Create a new deck with the provided name
        const [{ id: newDeckId }] = await db
          .insert(decks)
          .values({
            name: deck_name,
            userId: user.id,
            visibility: visibility || "private",
            language,
            isDefault: false,
          })
          .returning({ id: decks.id });
        targetDeckId = newDeckId;
      }
    } else {
      // No deck name provided, use default deck
      const defaultDeck = await db
        .select()
        .from(decks)
        .where(and(eq(decks.userId, user.id), eq(decks.isDefault, true)))
        .limit(1)
        .then((res) => res[0]);

      targetDeckId = defaultDeck.id;
    }

    // Prepare flashcards for insertion
    const flashcardsToInsert = flashcards.map((card) => ({
      deckId: targetDeckId,
      front: card.front,
      back: card.back,
      notes: card.notes || null,
    }));

    // Insert all flashcards in a single batch
    const result = await db
      .insert(flashcardsTable)
      .values(flashcardsToInsert)
      .returning();

    revalidatePath("/dashboard/flashcards");

    return NextResponse.json({
      message: "Flashcards imported successfully",
      imported_count: result.length,
    });
  },
);
