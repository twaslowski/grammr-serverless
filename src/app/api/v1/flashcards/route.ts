import { User } from "@supabase/supabase-js";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { decks, deckStudy, flashcards, studyCard } from "@/db/schemas";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { FlashcardBack, FlashcardWithDeck } from "@/types/flashcards";

import {
  CreateFlashcardRequestSchema,
  FlashcardListQuerySchema,
} from "./schema";

// GET /api/v1/flashcards - List flashcards with optional filtering
export const GET = withApiHandler(
  {
    querySchema: FlashcardListQuerySchema,
  },
  async ({ user, query }) => {
    const { deckId, search } = query;

    // Build where conditions
    const conditions = buildConditions(user, deckId, search);

    // Build and execute query
    const result = await db
      .selectDistinctOn([flashcards.id], {
        flashcard: flashcards,
        deck: {
          id: decks.id,
          name: decks.name,
          userId: decks.userId,
        },
        studyCard: studyCard.id,
      })
      .from(flashcards)
      .innerJoin(decks, eq(flashcards.deckId, decks.id))
      .leftJoin(
        studyCard,
        and(
          eq(flashcards.id, studyCard.flashcardId),
          eq(studyCard.userId, user.id),
        ),
      )
      .where(and(...conditions))
      .orderBy(flashcards.id, flashcards.updatedAt);

    // Transform to match expected format
    const flashcardsWithDeck: FlashcardWithDeck[] = result.map((row) => ({
      ...row.flashcard,
      back: row.flashcard.back as FlashcardBack,
      deck: row.deck,
      studyCard: row.studyCard || undefined,
    }));

    return NextResponse.json(flashcardsWithDeck);
  },
);

function buildConditions(
  user: User,
  deckId: number | undefined,
  search: string | undefined,
) {
  const conditions = [];

  // Join with deck_study to filter by decks the user is studying
  // This includes both owned decks and public decks they're studying
  const userDecks = db
    .select({ deckId: deckStudy.deckId })
    .from(deckStudy)
    .where(eq(deckStudy.userId, user.id));

  conditions.push(inArray(flashcards.deckId, userDecks));

  // Filter by deck if specified
  if (deckId) {
    conditions.push(eq(flashcards.deckId, deckId));
  }

  // Handle search
  if (search) {
    conditions.push(
      or(
        ilike(flashcards.front, `%${search}%`),
        sql`${flashcards.back}->>'translation' ILIKE '%' ||
            ${search}
            ||
            '%'`,
      ),
    );
  }
  return conditions;
}

// POST /api/v1/flashcards - Create a new flashcard
export const POST = withApiHandler(
  {
    bodySchema: CreateFlashcardRequestSchema,
  },
  async ({ user, body }) => {
    const { deck_id, front, back, notes } = body;

    // If no deck_id provided, get the user's default deck
    let targetDeckId = deck_id;
    if (!targetDeckId) {
      const defaultDeck = await db
        .select()
        .from(decks)
        .where(and(eq(decks.userId, user.id), eq(decks.isDefault, true)))
        .limit(1)
        .then((res) => res[0]);

      if (!defaultDeck) {
        return NextResponse.json(
          { error: "No default deck found. Please create a deck first." },
          { status: 400 },
        );
      }

      targetDeckId = defaultDeck.id;
    } else {
      // Verify the deck belongs to the user
      const deck = await db
        .select()
        .from(decks)
        .where(and(eq(decks.id, targetDeckId), eq(decks.userId, user.id)))
        .limit(1)
        .then((res) => res[0]);

      if (!deck) {
        return NextResponse.json(
          { error: "Deck not found or access denied" },
          { status: 404 },
        );
      }
    }

    const [flashcard] = await db
      .insert(flashcards)
      .values({
        deckId: targetDeckId,
        front,
        back,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(flashcard, { status: 201 });
  },
);
