import { User } from "@supabase/supabase-js";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import {
  decks,
  deckStudy,
  flashcards,
  flashcardStudy,
} from "@/db/schemas/schema";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { ensureProfile } from "@/lib/server/ensure-profile";
import { FlashcardWithDeck } from "@/types/flashcards";

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
    const { deckId, search, limit, offset } = query;

    // Build where conditions
    const conditions = buildConditions(user, deckId, search);

    const result = await db
      .select({
        flashcard: flashcards,
        deck: {
          id: decks.id,
          name: decks.name,
          userId: decks.userId,
        },
        studyCard: flashcardStudy.id,
      })
      .from(flashcards)
      .innerJoin(decks, eq(flashcards.deckId, decks.id))
      .leftJoin(
        flashcardStudy,
        and(
          eq(flashcards.id, flashcardStudy.flashcardId),
          eq(flashcardStudy.userId, user.id),
        ),
      )
      .where(and(...conditions))
      // The `id` tiebreaker is load-bearing, not cosmetic: `updatedAt` is not
      // unique, and without a total order Postgres may return the same row on
      // two consecutive pages and drop another entirely.
      .orderBy(desc(flashcards.updatedAt), desc(flashcards.id))
      // One more than asked for, so the end of the list is known without a
      // second COUNT query.
      .limit(limit + 1)
      .offset(offset);

    const hasMore = result.length > limit;
    const page = hasMore ? result.slice(0, limit) : result;

    const items: FlashcardWithDeck[] = page.map((row) => ({
      ...row.flashcard,
      deck: row.deck,
      studyCard: row.studyCard || undefined,
    }));

    // Offset paging rather than keyset, deliberately: keyset on `updatedAt`
    // breaks as soon as an edit moves a row to the top mid-scroll, and offset
    // has the same symptom for a fraction of the machinery at these list sizes.
    return NextResponse.json({
      items,
      nextOffset: hasMore ? offset + limit : null,
    });
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
      // The default deck is created by the `handle_new_profile()` trigger, so a
      // user who reaches this route before ever loading the dashboard would
      // otherwise have no deck to write to.
      await ensureProfile(user.id);

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
