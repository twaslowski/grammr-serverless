import { and, eq, lte, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

import { StudyBatchQuerySchema } from "@/app/api/v1/study/schema";
import { db } from "@/db/connect";
import { decks, flashcards, flashcardStudy } from "@/db/schemas/schema";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { scheduleCard } from "@/lib/fsrs";
import { shuffle } from "@/lib/shuffle";

/**
 * GET /api/v1/study - Get a batch of cards to study with scheduling options
 */
export const GET = withApiHandler(
  {
    querySchema: StudyBatchQuerySchema,
  },
  async ({ user, query }) => {
    const limit = query.limit;

    const now = new Date();

    // Fetch due review cards (priority over new cards)
    const reviewCards = await db
      .select({
        flashcard_study: flashcardStudy,
        flashcard: {
          id: flashcards.id,
          front: flashcards.front,
          back: flashcards.back,
          notes: flashcards.notes,
          language: decks.language,
        },
      })
      .from(flashcardStudy)
      .innerJoin(flashcards, eq(flashcardStudy.flashcardId, flashcards.id))
      .innerJoin(decks, eq(flashcards.deckId, decks.id))
      .where(
        and(
          eq(flashcardStudy.userId, user.id),
          ne(flashcardStudy.state, "New"),
          lte(flashcardStudy.due, now),
        ),
      )
      .orderBy(flashcardStudy.due)
      .limit(limit);

    // Calculate how many new cards we need to fill the batch
    const reviewCardCount = reviewCards?.length || 0;
    const remainingSlots = limit - reviewCardCount;

    let newCards: typeof reviewCards = [];
    if (remainingSlots > 0) {
      newCards = await db
        .select({
          flashcard_study: flashcardStudy,
          flashcard: {
            id: flashcards.id,
            front: flashcards.front,
            back: flashcards.back,
            notes: flashcards.notes,
            language: decks.language,
          },
        })
        .from(flashcardStudy)
        .innerJoin(flashcards, eq(flashcardStudy.flashcardId, flashcards.id))
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .where(
          and(
            eq(flashcardStudy.userId, user.id),
            eq(flashcardStudy.state, "New"),
          ),
        )
        .orderBy(flashcardStudy.createdAt)
        .limit(remainingSlots);
    }

    // Combine cards: review cards first, then new cards. Each group is
    // shuffled so cards aren't always presented in the same relative
    // sequence, which otherwise lets a user recall a card by its position
    // next to another card instead of recalling it on its own.
    const allCards = [...shuffle(reviewCards || []), ...shuffle(newCards)];

    if (allCards.length === 0) {
      return NextResponse.json({
        cards: [],
        sessionProgress: {
          reviewed: 0,
          remaining: 0,
          total: 0,
        },
      });
    }

    // Get total counts for progress
    const [dueResult, newResult] = await Promise.all([
      db
        .select()
        .from(flashcardStudy)
        .where(
          and(
            eq(flashcardStudy.userId, user.id),
            ne(flashcardStudy.state, "New"),
            lte(flashcardStudy.due, now),
          ),
        ),
      db
        .select()
        .from(flashcardStudy)
        .where(
          and(
            eq(flashcardStudy.userId, user.id),
            eq(flashcardStudy.state, "New"),
          ),
        ),
    ]);

    const remaining = (dueResult.length || 0) + (newResult.length || 0);

    // The `flashcard_study` row is already the wire shape (see @/types/fsrs),
    // so it needs no remapping — only the joined flashcard is attached.
    const cardsWithScheduling = allCards.map((row) => ({
      card: { ...row.flashcard_study, flashcard: row.flashcard },
      schedulingOptions: scheduleCard(row.flashcard_study, now),
    }));

    return NextResponse.json({
      cards: cardsWithScheduling,
      sessionProgress: {
        reviewed: 0, // This would be tracked in session state
        remaining,
        total: remaining,
      },
    });
  },
);
