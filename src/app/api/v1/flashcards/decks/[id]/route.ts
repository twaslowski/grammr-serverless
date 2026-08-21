import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { UpdateDeckRequestSchema } from "@/app/api/v1/flashcards/schema";
import { db } from "@/db/connect";
import { decks, flashcards } from "@/db/schemas/schema";
import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";

/** Loads a deck only if the requesting user owns it. */
async function findOwnedDeck(deckId: number, userId: string) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  return deck;
}

// GET /api/v1/flashcards/decks/[id] - Get a single deck with its flashcards
export const GET = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, params }) => {
    const deck = await findOwnedDeck(params.id, user.id);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const deckFlashcards = await db
      .select({
        id: flashcards.id,
        front: flashcards.front,
        back: flashcards.back,
        notes: flashcards.notes,
        createdAt: flashcards.createdAt,
        updatedAt: flashcards.updatedAt,
      })
      .from(flashcards)
      .where(eq(flashcards.deckId, deck.id));

    return NextResponse.json({ ...deck, flashcards: deckFlashcards });
  },
);

// PATCH /api/v1/flashcards/decks/[id] - Update a deck
export const PATCH = withApiHandler(
  {
    paramsSchema: IdParamSchema,
    bodySchema: UpdateDeckRequestSchema,
  },
  async ({ user, params, body }) => {
    if (!(await findOwnedDeck(params.id, user.id))) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const [deck] = await db
      .update(decks)
      .set(body)
      .where(eq(decks.id, params.id))
      .returning();

    return NextResponse.json(deck);
  },
);

// DELETE /api/v1/flashcards/decks/[id] - Delete a deck
export const DELETE = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, params }) => {
    const existing = await findOwnedDeck(params.id, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default deck" },
        { status: 400 },
      );
    }

    await db.delete(decks).where(eq(decks.id, params.id));

    return new NextResponse(null, { status: 204 });
  },
);
