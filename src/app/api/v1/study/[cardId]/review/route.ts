import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SubmitReviewRequestSchema } from "../../schema";
import { processReview } from "@/lib/fsrs";
import { Card as DbCard } from "@/types/fsrs";

interface RouteParams {
  params: Promise<{
    cardId: string;
  }>;
}

/**
 * POST /api/v1/study/[cardId]/review - Submit a review for a card
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { cardId } = await params;
    const cardIdNum = parseInt(cardId, 10);

    if (isNaN(cardIdNum)) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const bodyResult = SubmitReviewRequestSchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: bodyResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { rating } = bodyResult.data;
    const now = new Date();

    // Fetch the card
    const { data: cardData, error: cardError } = await supabase
      .from("card")
      .select("*")
      .eq("id", cardIdNum)
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
      .eq("id", cardIdNum)
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
        card_id: cardIdNum,
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
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
