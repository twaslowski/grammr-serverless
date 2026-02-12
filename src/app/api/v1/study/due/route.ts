import { and, count, eq, lte, not } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { flashcardStudy } from "@/db/schemas";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { DueCardsQuerySchema } from "../schema";

/**
 * GET /api/v1/study/due - Get count of due cards for the current user
 */
export const GET = withApiHandler(
  {
    querySchema: DueCardsQuerySchema,
  },
  async ({ user, query }) => {
    const { include_new } = query;
    const now = new Date();

    const [{ newCardCount: newCount }] = await db
      .select({ newCardCount: count() })
      .from(flashcardStudy)
      .where(
        and(
          eq(flashcardStudy.userId, user.id),
          eq(flashcardStudy.state, "New"),
        ),
      );

    console.log(newCount);

    // Count review cards (due <= now and not New)

    const [{ dueCardCount: reviewCount }] = await db
      .select({ dueCardCount: count() })
      .from(flashcardStudy)
      .where(
        and(
          eq(flashcardStudy.userId, user.id),
          not(eq(flashcardStudy.state, "Review")),
          lte(flashcardStudy.due, now),
        ),
      );

    const dueCount = (reviewCount || 0) + (include_new ? newCount || 0 : 0);

    return NextResponse.json({
      dueCount,
      newCount: newCount || 0,
      reviewCount: reviewCount || 0,
    });
  },
);
