import { NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { DueCardsQuerySchema } from "../schema";

/**
 * GET /api/v1/study/due - Get count of due cards for the current user
 */
export const GET = withApiHandler(
  {
    querySchema: DueCardsQuerySchema,
  },
  async ({ user, supabase, query }) => {
    const { include_new } = query;
    const now = new Date().toISOString();

    // Count new cards
    const { count: newCount, error: newError } = await supabase
      .from("card")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("state", "New");

    if (newError) {
      console.error("Failed to count new cards:", newError);
      return NextResponse.json(
        { error: "Failed to count new cards" },
        { status: 500 },
      );
    }

    // Count review cards (due <= now and not New)
    const { count: reviewCount, error: reviewError } = await supabase
      .from("card")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("state", "New")
      .lte("due", now);

    if (reviewError) {
      console.error("Failed to count review cards:", reviewError);
      return NextResponse.json(
        { error: "Failed to count review cards" },
        { status: 500 },
      );
    }

    // Calculate total due count
    const dueCount = (reviewCount || 0) + (include_new ? newCount || 0 : 0);

    return NextResponse.json({
      dueCount,
      newCount: newCount || 0,
      reviewCount: reviewCount || 0,
    });
  },
);
