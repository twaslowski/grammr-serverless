import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { CreateDeckRequestSchema } from "@/app/api/v1/flashcards/schema";
import { db } from "@/db/connect";
import { decks, deckStudy } from "@/db/schemas";
import { withApiHandler } from "@/lib/api/with-api-handler";

// GET /api/v1/flashcards/decks - List all decks the user owns or studies
export const GET = withApiHandler({}, async ({ user }) => {
  const result = await db
    .selectDistinct()
    .from(decks)
    .leftJoin(deckStudy, eq(decks.id, deckStudy.deckId))
    .where(or(eq(decks.userId, user.id), eq(deckStudy.userId, user.id)));

  // todo: right now, an object of type [{deck: Deck, deckStudy: DeckStudy}] is returned, but only the deck is needed.
  // Find a different way to write the query.
  const deckList = result.map((r) => r.deck);
  return NextResponse.json(deckList);
});

// POST /api/v1/flashcards/decks - Create a new deck
export const POST = withApiHandler(
  {
    bodySchema: CreateDeckRequestSchema,
  },
  async ({ user, supabase, body }) => {
    const { name, description } = body;

    const { data: deck, error } = await supabase
      .from("deck")
      .insert({
        name,
        description: description || null,
        user_id: user.id,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create deck:", error);
      return NextResponse.json(
        { error: "Failed to create deck" },
        { status: 500 },
      );
    }

    return NextResponse.json(deck, { status: 201 });
  },
);
