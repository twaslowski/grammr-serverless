import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { DeckSchema } from "@/types/flashcards";

// GET /api/v1/flashcards/decks/studied - List all decks the user is studying
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (error) {
    console.error("Studied decks list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
