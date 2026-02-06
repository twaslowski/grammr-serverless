import { NextResponse } from "next/server";

import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";

// DELETE /api/v1/flashcards/decks/studied/[id] - Stop studying a deck
export const DELETE = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ user, supabase, params }) => {
    // Delete the deck_study relationship
    // This will cascade and delete all cards for this user/deck due to the trigger
    const { error } = await supabase
      .from("deck_study")
      .delete()
      .eq("deck_id", params.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to stop studying deck:", error);
      return NextResponse.json(
        { error: "Failed to stop studying deck" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  },
);
