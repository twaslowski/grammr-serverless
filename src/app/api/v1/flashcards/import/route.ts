import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { decks, flashcards as flashcardsTable } from "@/db/schemas/schema";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { FlashcardImportRequestSchema } from "../schema";

// POST /api/v1/flashcards/import - Import flashcards to a specified deck or default deck
export const POST = withApiHandler(
  {
    bodySchema: FlashcardImportRequestSchema,
  },
  async ({ user, body }) => {
    const { flashcards, deckId } = body;

    if (flashcards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards to import" },
        { status: 400 },
      );
    }

    // A named deck must be one the caller owns; an unnamed one resolves to
    // their default deck, which is what the UI now always wants.
    const [deck] = await db
      .select({ id: decks.id })
      .from(decks)
      .where(
        and(
          eq(decks.userId, user.id),
          deckId === undefined
            ? eq(decks.isDefault, true)
            : eq(decks.id, deckId),
        ),
      )
      .limit(1);

    if (!deck) {
      return NextResponse.json(
        { error: "Deck not found or not owned by user" },
        { status: 404 },
      );
    }

    // Prepare flashcards for insertion
    const flashcardsToInsert = flashcards.map((card) => ({
      deckId: deck.id,
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
