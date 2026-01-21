import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { StudySessionQuerySchema } from "./schema";
import { scheduleCard } from "@/lib/fsrs";
import { Card as DbCard } from "@/types/fsrs";

/**
 * GET /api/v1/study - Get the next card to study with scheduling options
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const queryResult = StudySessionQuerySchema.safeParse({
      limit: searchParams.get("limit"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: queryResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const nowStr = now.toISOString();

    // First, try to get a due review card (priority over new cards)
    let { data: cards, error: cardError } = await supabase
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
      .limit(1);

    // If no review cards, get a new card
    if (!cardError && (!cards || cards.length === 0)) {
      const result = await supabase
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
        .limit(1);

      cards = result.data;
      cardError = result.error;
    }

    if (cardError) {
      console.error("Failed to fetch cards:", cardError);
      return NextResponse.json(
        { error: "Failed to fetch cards" },
        { status: 500 },
      );
    }

    if (!cards || cards.length === 0) {
      return NextResponse.json({
        card: null,
        schedulingOptions: [],
        sessionProgress: {
          reviewed: 0,
          remaining: 0,
          total: 0,
        },
      });
    }

    const cardData = cards[0];

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

    // Generate scheduling options
    const schedulingOptions = scheduleCard(dbCard, now);

    return NextResponse.json({
      card: {
        ...dbCard,
        due: dbCard.due.toISOString(),
        last_review: dbCard.last_review?.toISOString() || null,
        flashcard: cardData.flashcard,
      },
      schedulingOptions,
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
