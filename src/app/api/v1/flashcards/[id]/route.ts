import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { decks, flashcards } from "@/db/schemas/schema";
import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";
import { UpdateFlashcardRequestSchema } from "../schema";

/**
 * Loads a flashcard only if it sits in a deck the requesting user owns.
 * Ownership is enforced here because the Drizzle connection bypasses RLS.
 */
async function findOwnedFlashcard(flashcardId: number, userId: string) {
  const [row] = await db
    .select({
      flashcard: flashcards,
      deck: { id: decks.id, name: decks.name },
    })
    .from(flashcards)
    .innerJoin(decks, eq(flashcards.deckId, decks.id))
    .where(and(eq(flashcards.id, flashcardId), eq(decks.userId, userId)))
    .limit(1);

  return row;
}

function revalidateFlashcards(id: number) {
  revalidatePath(`/dashboard/flashcards`);
  revalidatePath(`/flashcards/${id}`);
}

// GET /api/v1/flashcards/[id] - Get a single flashcard
export const GET = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, params }) => {
    const row = await findOwnedFlashcard(params.id, user.id);

    if (!row) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ...row.flashcard, deck: row.deck });
  },
);

// PATCH /api/v1/flashcards/[id] - Update a flashcard
export const PATCH = withApiHandler(
  {
    paramsSchema: IdParamSchema,
    bodySchema: UpdateFlashcardRequestSchema,
  },
  async ({ user, params, body }) => {
    if (!(await findOwnedFlashcard(params.id, user.id))) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    const { deck_id: targetDeckId, ...rest } = body;

    // Moving a card between decks requires owning the destination too.
    if (targetDeckId) {
      const [targetDeck] = await db
        .select({ id: decks.id })
        .from(decks)
        .where(and(eq(decks.id, targetDeckId), eq(decks.userId, user.id)))
        .limit(1);

      if (!targetDeck) {
        return NextResponse.json(
          { error: "Target deck not found or access denied" },
          { status: 404 },
        );
      }
    }

    const [flashcard] = await db
      .update(flashcards)
      .set({
        ...rest,
        ...(targetDeckId ? { deckId: targetDeckId } : {}),
        version: sql`${flashcards.version} + 1`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(flashcards.id, params.id))
      .returning();

    revalidateFlashcards(params.id);

    return NextResponse.json(flashcard);
  },
);

// DELETE /api/v1/flashcards/[id] - Delete a flashcard
export const DELETE = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, params }) => {
    if (!(await findOwnedFlashcard(params.id, user.id))) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    await db.delete(flashcards).where(eq(flashcards.id, params.id));

    revalidateFlashcards(params.id);

    return new NextResponse(null, { status: 204 });
  },
);
