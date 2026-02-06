import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/with-api-handler";

// GET /api/v1/flashcards/decks/default - Get the user's default deck
export const GET = withApiHandler({}, async ({ user, supabase }) => {
  const { data: deck, error } = await supabase
    .from("deck")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  if (error || !deck) {
    return NextResponse.json(
      { error: "Default deck not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(deck);
});
