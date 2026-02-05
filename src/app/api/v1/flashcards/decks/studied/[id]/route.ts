import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// DELETE /api/v1/flashcards/decks/studied/[id] - Stop studying a deck
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    // Delete the deck_study relationship
    // This will cascade and delete all cards for this user/deck due to the trigger
    const { error } = await supabase
      .from("deck_study")
      .delete()
      .eq("deck_id", deckId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to stop studying deck:", error);
      return NextResponse.json(
        { error: "Failed to stop studying deck" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stop studying deck error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
