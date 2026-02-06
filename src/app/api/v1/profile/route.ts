import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

import { withApiHandler } from "@/lib/api/with-api-handler";
import { LanguageCode, LanguageCodeSchema } from "@/types/languages";
import { db } from "@/db/connect";
import { profile, decks, deckStudy } from "@/db/schemas";

const SaveProfileRequestSchema = z.object({
  sourceLanguage: LanguageCodeSchema,
  targetLanguage: LanguageCodeSchema,
});

// POST/PUT /api/v1/profile - Save or update user profile
export const POST = withApiHandler(
  {
    bodySchema: SaveProfileRequestSchema,
  },
  async ({ user, body }) => {
    await db
        .insert(profile)
        .values({
          id: user.id,
          sourceLanguage: body.sourceLanguage,
          targetLanguage: body.targetLanguage,
        })
        .onConflictDoUpdate({
          target: profile.id,
          set: {
            sourceLanguage: body.sourceLanguage,
            targetLanguage: body.targetLanguage,
          },
        });

    await syncDeckStudies(user.id, body.targetLanguage);

    return NextResponse.json({
      message: "Profile saved successfully",
    });
  },
);

export const syncDeckStudies = async (
    userId: string,
    language: LanguageCode,
) => {
  const publicDecks = await getPublicDecks(language);
  if (!publicDecks || publicDecks.length === 0) return;

  void studyDeck(userId, publicDecks[0].id);
};

export const getPublicDecks = async (language: LanguageCode) => {
  return await db
      .select()
      .from(decks)
      .where(and(eq(decks.language, language), eq(decks.visibility, "public")));
};

export const studyDeck = async (userId: string, deckId: number) => {
  await db
      .insert(deckStudy)
      .values({
        id: crypto.randomUUID(),
        userId,
        deckId,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [deckStudy.userId, deckStudy.deckId],
        set: {
          isActive: true,
        },
      });
};


// PUT is just an alias for POST for this endpoint
export const PUT = POST;

