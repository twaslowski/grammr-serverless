import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { flashcardStudy, reviewLogs } from "@/db/schemas/schema";
import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";
import { processReview } from "@/lib/fsrs";
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

    // The row is already the shape FSRS expects (see @/types/fsrs).
    const { updatedCard, reviewLog } = processReview(
      cardResults[0],
      rating,
      now,
    );

    try {
      // Update the card
      const updatedCardData = await db
        .update(flashcardStudy)
        .set({ ...updatedCard, lastReview: updatedCard.lastReview ?? now })
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
        .values({ ...reviewLog, flashcardStudyId: params.id })
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
