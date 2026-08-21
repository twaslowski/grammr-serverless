import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { decks, deckStudy } from "@/db/schemas/schema";
import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";

// POST /api/v1/flashcards/decks/study/[id] - Start studying a deck
export const POST = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, params }) => {
    // A deck may only be studied if the user owns it or it is publicly shared.
    // RLS is not enforced on this connection, so the check has to happen here.
    const [deck] = await db
      .select({ id: decks.id })
      .from(decks)
      .where(
        and(
          eq(decks.id, params.id),
          or(eq(decks.userId, user.id), eq(decks.visibility, "public")),
        ),
      )
      .limit(1);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

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
