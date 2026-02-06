import { NextResponse } from "next/server";

import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";

// GET /api/v1/flashcards/[id]/study - Get study card for a flashcard
export const GET = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ supabase, params }) => {
    const { data: card, error } = await supabase
      .from("card")
      .select("*")
      .eq("flashcard_id", params.id)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(card);
  },
);

// DELETE /api/v1/flashcards/[id]/study - Delete study card for a flashcard
export const DELETE = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ supabase, params }) => {
    const { error } = await supabase
      .from("card")
      .delete()
      .eq("flashcard_id", params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Could not delete flashcard", reason: error.details },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Flashcard deleted successfully" });
  },
);
