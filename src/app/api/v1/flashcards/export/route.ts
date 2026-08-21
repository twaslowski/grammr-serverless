import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { decks, flashcards } from "@/db/schemas/schema";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { DeckVisibility } from "@/types/deck";
import { FlashcardBack } from "@/types/flashcards";
import { LanguageCode } from "@/types/languages";
import { FlashcardExport } from "../schema";

// GET /api/v1/flashcards/export - Export all user's flashcards (without progress)
export const GET = withApiHandler({}, async ({ user }) => {
  const rows = await db
    .select({
      front: flashcards.front,
      back: flashcards.back,
      notes: flashcards.notes,
      deckName: decks.name,
      language: decks.language,
      visibility: decks.visibility,
    })
    .from(flashcards)
    .innerJoin(decks, eq(flashcards.deckId, decks.id))
    .where(eq(decks.userId, user.id))
    .orderBy(asc(flashcards.createdAt));

  const exportData: FlashcardExport = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    // Exports are assumed to come from decks sharing one language/visibility.
    language: rows[0]?.language as LanguageCode | undefined,
    visibility: rows[0]?.visibility as DeckVisibility | undefined,
    flashcards: rows.map((row) => ({
      front: row.front,
      back: row.back as FlashcardBack,
      notes: row.notes,
      deck_name: row.deckName,
    })),
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
