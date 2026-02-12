import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { flashcardStudy, reviewLogs } from "@/db/schemas";
import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";
import { processReview } from "@/lib/fsrs";
import { Card as DbCard } from "@/types/fsrs";
import { SubmitReviewRequestSchema } from "../../schema";

/**
 * POST /api/v1/study/[id]/review - Submit a review for a card
 */
export const POST = withApiHandler(
  {
    paramsSchema: IdParamSchema,
    bodySchema: SubmitReviewRequestSchema,
  },
  async ({ user, params, body }) => {
    const { rating } = body;
    const now = new Date();

    // Fetch the card
    const cardResults = await db
      .select()
      .from(flashcardStudy)
      .where(
        and(
          eq(flashcardStudy.id, params.id),
          eq(flashcardStudy.userId, user.id),
        ),
      )
      .limit(1);

    if (cardResults.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const cardData = cardResults[0];

    // Convert to DbCard format
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

    // Process the review using FSRS
    const { updatedCard, reviewLog } = processReview(dbCard, rating, now);

    try {
      // Update the card
      const updatedCardData = await db
        .update(flashcardStudy)
        .set({
          due: updatedCard.due,
          stability: updatedCard.stability,
          difficulty: updatedCard.difficulty,
          elapsedDays: updatedCard.elapsed_days,
          scheduledDays: updatedCard.scheduled_days,
          learningSteps: updatedCard.learning_steps,
          reps: updatedCard.reps,
          lapses: updatedCard.lapses,
          state: updatedCard.state,
          lastReview: updatedCard.last_review || now,
        })
        .where(
          and(
            eq(flashcardStudy.id, params.id),
            eq(flashcardStudy.userId, user.id),
          ),
        )
        .returning();

      if (updatedCardData.length === 0) {
        return NextResponse.json(
          { error: "Failed to update card" },
          { status: 500 },
        );
      }

      // Create the review log
      const reviewLogData = await db
        .insert(reviewLogs)
        .values({
          cardId: params.id,
          rating: reviewLog.rating,
          state: reviewLog.state,
          due: reviewLog.due,
          stability: reviewLog.stability,
          difficulty: reviewLog.difficulty,
          elapsedDays: reviewLog.elapsed_days,
          lastElapsedDays: reviewLog.last_elapsed_days,
          scheduledDays: reviewLog.scheduled_days,
          learningSteps: reviewLog.learning_steps,
          review: reviewLog.review,
        })
        .returning();

      return NextResponse.json({
        success: true,
        updatedCard: updatedCardData[0],
        reviewLog: reviewLogData[0],
      });
    } catch (error) {
      console.error("Failed to update card or create review log:", error);
      return NextResponse.json(
        { error: "Failed to process review" },
        { status: 500 },
      );
    }
  },
);
