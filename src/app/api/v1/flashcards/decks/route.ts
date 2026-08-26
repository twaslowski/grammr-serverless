import { and, eq, getTableColumns, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { CreateDeckRequestSchema } from "@/app/api/v1/flashcards/schema";
import { db } from "@/db/connect";
import { decks, deckStudy, profiles } from "@/db/schemas/schema";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { LanguageCode } from "@/types/languages";

// GET /api/v1/flashcards/decks - List all decks the user owns or studies, via a deck_study subquery
export const GET = withApiHandler({}, async ({ user }) => {
  const result = await db
    .selectDistinct({ ...getTableColumns(decks), deckStudyId: deckStudy.id })
    .from(decks)
    .leftJoin(
      deckStudy,
      and(eq(decks.id, deckStudy.deckId), eq(deckStudy.userId, user.id)),
    )
    .where(
      or(
        eq(decks.userId, user.id),
        inArray(
          decks.id,
          db
            .select({ id: deckStudy.deckId })
            .from(deckStudy)
            .where(eq(deckStudy.userId, user.id)),
        ),
      ),
    );

  // Transform the result to include isStudying flag
  const decksWithStudyStatus = result.map(({ deckStudyId, ...deck }) => ({
    ...deck,
    isStudying: !!deckStudyId,
  }));

  return NextResponse.json(decksWithStudyStatus);
});

// POST /api/v1/flashcards/decks - Create a new deck
export const POST = withApiHandler(
  {
    bodySchema: CreateDeckRequestSchema,
  },
  async ({ user, body }) => {
    const { name, description, language, visibility } = body;

    // deck.language is NOT NULL. Fall back to the language the user is
    // learning, which every profile has.
    let deckLanguage: LanguageCode | undefined = language;
    if (!deckLanguage) {
      const [profile] = await db
        .select({ targetLanguage: profiles.targetLanguage })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);

      if (!profile) {
        return NextResponse.json(
          { error: "No language given and no profile to infer it from" },
          { status: 400 },
        );
      }

      deckLanguage = profile.targetLanguage;
    }

    const [deck] = await db
      .insert(decks)
      .values({
        name,
        language: deckLanguage,
        description: description || null,
        userId: user.id,
        isDefault: false,
        ...(visibility ? { visibility } : {}),
      })
      .returning();

    return NextResponse.json(deck, { status: 201 });
  },
);
