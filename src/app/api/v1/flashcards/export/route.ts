import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { FlashcardExport } from "../schema";

// GET /api/v1/flashcards/export - Export all user's flashcards (without progress)
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

    // Fetch all flashcards for the user, joining with deck to get deck name
    const { data: flashcards, error } = await supabase
      .from("flashcard")
      .select(
        `
        front,
        type,
        back,
        notes,
        deck!inner (
          name,
          user_id
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
      const deck = card.deck as unknown as { name: string; user_id: string };
      return {
        front: card.front,
        type: card.type,
        back: card.back,
        notes: card.notes,
        deck_name: deck.name,
      };
    });

    const exportData: FlashcardExport = {
      version: 1,
      exported_at: new Date().toISOString(),
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
  } catch (error) {
    console.error("Flashcard export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
