import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { LanguageCode } from "@/types/languages";
import { FlashcardExport } from "../schema";

// GET /api/v1/flashcards/export - Export all user's flashcards (without progress)
export const GET = withApiHandler({}, async ({ user, supabase }) => {
  // Fetch all flashcards for the user, joining with deck to get deck name and language
  const { data: flashcards, error } = await supabase
    .from("flashcard")
    .select(
      `
        front,
        back,
        notes,
        deck!inner (
          name,
          user_id,
          language,
          visibility
        )
      `,
    )
    .eq("deck.user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch flashcards for export:", error);
    return NextResponse.json(
      { error: "Failed to export flashcards" },
      { status: 500 },
    );
  }

  // Transform to export format
  const exportedFlashcards = flashcards.map((card) => {
    // deck comes as an object when using !inner join, but TypeScript infers it as array
    const deck = card.deck as unknown as {
      name: string;
      user_id: string;
      language: string;
      visibility: string;
    };
    return {
      front: card.front,
      back: card.back,
      notes: card.notes,
      deck_name: deck.name,
    };
  });

  // Get language and visibility from the first deck
  // (assuming most exports will be from decks with the same language)
  const firstDeck = flashcards[0]?.deck as unknown as {
    language?: string;
    visibility?: string;
  };

  const exportData: FlashcardExport = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    language: firstDeck?.language as LanguageCode | undefined,
    visibility: firstDeck?.visibility as "private" | "public" | undefined,
    flashcards: exportedFlashcards,
  };

  // Return as downloadable JSON file
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="flashcards-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
});
