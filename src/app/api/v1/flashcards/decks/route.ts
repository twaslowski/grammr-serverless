import { eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { CreateDeckRequestSchema } from "@/app/api/v1/flashcards/schema";
import { db } from "@/db/connect";
import { decks, deckStudy } from "@/db/schemas";
import { withApiHandler } from "@/lib/api/with-api-handler";

// GET /api/v1/flashcards/decks - List all decks the user owns or studies, via a deck_study subquery
export const GET = withApiHandler({}, async ({ user }) => {
  const result = await db
    .selectDistinct()
    .from(decks)
    .where(
      or(
        eq(decks.userId, user.id),
        inArray(
          decks.id,
          db
            .select({ id: deckStudy.deckId })
            .from(deckStudy)
            .where(eq(deckStudy.userId, user.id)),
        ),
      ),
    );

  return NextResponse.json(result);
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
