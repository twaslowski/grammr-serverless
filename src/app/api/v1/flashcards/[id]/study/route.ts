import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { flashcardStudy } from "@/db/schemas";
import { IdParamSchema, withApiHandler } from "@/lib/api/with-api-handler";

// GET /api/v1/flashcards/[id]/study - Get study card for a flashcard
export const GET = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ params, user }) => {
    const result = await db
      .select()
      .from(flashcardStudy)
      .where(
        and(
          eq(flashcardStudy.flashcardId, params.id),
          eq(flashcardStudy.userId, user.id),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Study card not found or not owned by user" },
        { status: 404 },
      );
    }

    return NextResponse.json(result[0]);
  },
);

// DELETE /api/v1/flashcards/[id]/study - Delete study card for a flashcard
export const DELETE = withApiHandler(
  {
    paramsSchema: IdParamSchema,
  },
  async ({ params, user }) => {
    const result = await db
      .delete(flashcardStudy)
      .where(
        and(
          eq(flashcardStudy.flashcardId, params.id),
          eq(flashcardStudy.userId, user.id),
        ),
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Study card not found or not owned by user" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Flashcard deleted successfully" });
  },
);
