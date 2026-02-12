import { and, eq, lte, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

import { DueCardsQuerySchema } from "@/app/api/v1/study/schema";
import { db } from "@/db/connect";
import { flashcards, flashcardStudy } from "@/db/schemas";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { scheduleCard } from "@/lib/fsrs";
import { Card as DbCard } from "@/types/fsrs";

/**
 * GET /api/v1/study - Get a batch of cards to study with scheduling options
 */
export const GET = withApiHandler(
  {
    querySchema: DueCardsQuerySchema,
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
        },
      })
      .from(flashcardStudy)
      .innerJoin(flashcards, eq(flashcardStudy.flashcardId, flashcards.id))
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
          },
        })
        .from(flashcardStudy)
        .innerJoin(flashcards, eq(flashcardStudy.flashcardId, flashcards.id))
        .where(
          and(
            eq(flashcardStudy.userId, user.id),
            eq(flashcardStudy.state, "New"),
          ),
        )
        .orderBy(flashcardStudy.createdAt)
        .limit(remainingSlots);
    }

    // Combine cards: review cards first, then new cards
    const allCards = [...(reviewCards || []), ...newCards];

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

    // Convert all cards to the response format with scheduling options
    const cardsWithScheduling = allCards.map((row) => {
      const cardData = row.flashcard_study;
      const dbCard: DbCard = {
        id: cardData.id,
        flashcard_id: cardData.flashcardId,
        user_id: cardData.userId,
        due: cardData.due,
        stability: cardData.stability,
        difficulty: cardData.difficulty,
        elapsed_days: cardData.elapsedDays,
        scheduled_days: cardData.scheduledDays,
        learning_steps: cardData.learningSteps,
        reps: cardData.reps,
        lapses: cardData.lapses,
        state: cardData.state,
        last_review: cardData.lastReview,
        created_at: cardData.createdAt,
        updated_at: cardData.updatedAt,
      };

      // Generate scheduling options for this card
      const schedulingOptions = scheduleCard(dbCard, now);

      return {
        card: {
          ...dbCard,
          due: dbCard.due.toISOString(),
          last_review: dbCard.last_review?.toISOString() || null,
          flashcard: row.flashcard,
        },
        schedulingOptions,
      };
    });

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
