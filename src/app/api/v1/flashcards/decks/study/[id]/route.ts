import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { decks, deckStudy } from "@/db/schemas";
import { takeUniqueOrThrow } from "@/db/util";
import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";

// POST /api/v1/flashcards/decks/study/[id] - Start studying a deck
export const POST = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, params }) => {
    // First, verify the deck exists and is visible to the user
    const deck = await db
      .select()
      .from(decks)
      .where(eq(decks.id, params.id))
      .then(takeUniqueOrThrow);

    await db
      .insert(deckStudy)
      .values({
        deckId: deck.id,
        userId: user.id,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [deckStudy.userId, deckStudy.deckId],
        set: {
          isActive: true,
        },
      });

    return NextResponse.json({ success: true });
  },
);

// DELETE /api/v1/flashcards/decks/study/[id] - Stop studying a deck
export const DELETE = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, params }) => {
    await db
      .delete(deckStudy)
      .where(
        and(eq(deckStudy.userId, user.id), eq(deckStudy.deckId, params.id)),
      );

    return NextResponse.json({ success: true });
  },
);
