import { NextResponse } from "next/server";

import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";
import { processReview } from "@/lib/fsrs";
import { Card as DbCard } from "@/types/fsrs";
import { SubmitReviewRequestSchema } from "../../schema";

/**
 * POST /api/v1/study/[cardId]/review - Submit a review for a card
 */
export const POST = withApiHandler(
  {
    paramsSchema: IdParamSchema,
    bodySchema: SubmitReviewRequestSchema,
  },
  async ({ user, supabase, params, body }) => {
    const { rating } = body;
    const now = new Date();

    // Fetch the card
    const { data: cardData, error: cardError } = await supabase
      .from("card")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (cardError) {
      console.error("Failed to fetch card:", cardError);
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Convert to DbCard format
    const dbCard: DbCard = {
      id: cardData.id,
      flashcard_id: cardData.flashcard_id,
      user_id: cardData.user_id,
      due: new Date(cardData.due),
      stability: cardData.stability,
      difficulty: cardData.difficulty,
      elapsed_days: cardData.elapsed_days,
      scheduled_days: cardData.scheduled_days,
      learning_steps: cardData.learning_steps,
      reps: cardData.reps,
      lapses: cardData.lapses,
      state: cardData.state,
      last_review: cardData.last_review ? new Date(cardData.last_review) : null,
      created_at: cardData.created_at,
      updated_at: cardData.updated_at,
    };

    // Process the review using FSRS
    const { updatedCard, reviewLog } = processReview(dbCard, rating, now);

    // Start a transaction-like operation: update card and create review log
    // Update the card
    const { data: updatedCardData, error: updateError } = await supabase
      .from("card")
      .update({
        due: updatedCard.due.toISOString(),
        stability: updatedCard.stability,
        difficulty: updatedCard.difficulty,
        elapsed_days: updatedCard.elapsed_days,
        scheduled_days: updatedCard.scheduled_days,
        learning_steps: updatedCard.learning_steps,
        reps: updatedCard.reps,
        lapses: updatedCard.lapses,
        state: updatedCard.state,
        last_review:
          updatedCard.last_review?.toISOString() || now.toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update card:", updateError);
      return NextResponse.json(
        { error: "Failed to update card" },
        { status: 500 },
      );
    }

    // Create the review log
    const { data: reviewLogData, error: logError } = await supabase
      .from("review_log")
      .insert({
        card_id: params.id,
        rating: reviewLog.rating,
        state: reviewLog.state,
        due: reviewLog.due.toISOString(),
        stability: reviewLog.stability,
        difficulty: reviewLog.difficulty,
        elapsed_days: reviewLog.elapsed_days,
        last_elapsed_days: reviewLog.last_elapsed_days,
        scheduled_days: reviewLog.scheduled_days,
        learning_steps: reviewLog.learning_steps,
        review: reviewLog.review.toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create review log:", logError);
      // Note: In production, we might want to rollback the card update
      // For now, we'll just log the error but return success for the card update
    }

    return NextResponse.json({
      success: true,
      updatedCard: updatedCardData,
      reviewLog: reviewLogData || reviewLog,
    });
  },
);
