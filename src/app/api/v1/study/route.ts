import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { DueCardsQuerySchema } from "@/app/api/v1/study/schema";
import { scheduleCard } from "@/lib/fsrs";
import { createClient } from "@/lib/supabase/server";
import { Card as DbCard } from "@/types/fsrs";

/**
 * GET /api/v1/study - Get a batch of cards to study with scheduling options
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryResult = DueCardsQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
      include_new: searchParams.get("include_new") ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: z.flattenError(queryResult.error),
        },
        { status: 400 },
      );
    }

    const limit = queryResult.data.limit;

    const now = new Date();
    const nowStr = now.toISOString();

    // Fetch due review cards (priority over new cards)
    const { data: reviewCards, error: reviewError } = await supabase
      .from("card")
      .select(
        `
        *,
        flashcard (
          id,
          front,
          back,
          notes
        )
      `,
      )
      .eq("user_id", user.id)
      .neq("state", "New")
      .lte("due", nowStr)
      .order("due", { ascending: true })
      .limit(limit);

    if (reviewError) {
      console.error("Failed to fetch review cards:", reviewError);
      return NextResponse.json(
        { error: "Failed to fetch cards" },
        { status: 500 },
      );
    }

    // Calculate how many new cards we need to fill the batch
    const reviewCardCount = reviewCards?.length || 0;
    const remainingSlots = limit - reviewCardCount;

    let newCards: typeof reviewCards = [];
    if (remainingSlots > 0) {
      const { data: fetchedNewCards, error: newError } = await supabase
        .from("card")
        .select(
          `
          *,
          flashcard (
            id,
            front,
            back,
            notes
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("state", "New")
        .order("created_at", { ascending: true })
        .limit(remainingSlots);

      if (newError) {
        console.error("Failed to fetch new cards:", newError);
        return NextResponse.json(
          { error: "Failed to fetch cards" },
          { status: 500 },
        );
      }
      newCards = fetchedNewCards || [];
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
      supabase
        .from("card")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("state", "New")
        .lte("due", nowStr),
      supabase
        .from("card")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("state", "New"),
    ]);

    const remaining = (dueResult.count || 0) + (newResult.count || 0);

    // Convert all cards to the response format with scheduling options
    const cardsWithScheduling = allCards.map((cardData) => {
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
        last_review: cardData.last_review
          ? new Date(cardData.last_review)
          : null,
        created_at: cardData.created_at,
        updated_at: cardData.updated_at,
      };

      // Generate scheduling options for this card
      const schedulingOptions = scheduleCard(dbCard, now);

      return {
        card: {
          ...dbCard,
          due: dbCard.due.toISOString(),
          last_review: dbCard.last_review?.toISOString() || null,
          flashcard: cardData.flashcard,
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
  } catch (error) {
    console.error("Study session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
