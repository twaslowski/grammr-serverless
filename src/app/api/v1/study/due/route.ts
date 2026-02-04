import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { DueCardsQuerySchema } from "../schema";
import {z} from "zod";

/**
 * GET /api/v1/study/due - Get count of due cards for the current user
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

    const queryResult = DueCardsQuerySchema.safeParse({
      limit: searchParams.get("limit"),
      include_new: searchParams.get("include_new"),
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

    const { include_new } = queryResult.data;
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
  } catch (error) {
    console.error("Study due count error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
