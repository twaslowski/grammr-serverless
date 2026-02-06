import { NextResponse } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { DeckSchema } from "@/types/flashcards";

// GET /api/v1/flashcards/decks/studied - List all decks the user is studying
export const GET = withApiHandler({}, async ({ user, supabase }) => {
  // Get all decks the user is studying via deck_study
  const { data: studiedDecks, error } = await supabase
    .from("deck_study")
    .select(
      `
        deck:deck_id (
          id,
          name,
          user_id,
          visibility,
          description,
          is_default,
          created_at,
          updated_at
        )
      `,
    )
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch studied decks:", error);
    return NextResponse.json(
      { error: "Failed to fetch studied decks" },
      { status: 500 },
    );
  }

  // The deck_study select returns an array of objects with a deck property
  const decks = studiedDecks
    .map((item: { deck: unknown }) => item.deck)
    .filter((deck): deck is NonNullable<typeof deck> => deck !== null);

  const parsed = z.array(DeckSchema).safeParse(decks);

  if (!parsed.success) {
    console.error("error parsing results: ", z.flattenError(parsed.error));
    return NextResponse.json(
      { error: "Malformed database response" },
      { status: 500 },
    );
  }

  return NextResponse.json(parsed.data);
});
