import { NextResponse } from "next/server";

import { db } from "@/db/connect";
import { profiles } from "@/db/schemas/schema";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { syncDeckStudies } from "@/lib/server/decks";
import { ProfileSchema } from "@/types/profile";

const SaveProfileRequestSchema = ProfileSchema.pick({
  sourceLanguage: true,
  targetLanguage: true,
});

// POST/PUT /api/v1/profile - Save or update user profile
export const POST = withApiHandler(
  {
    bodySchema: SaveProfileRequestSchema,
  },
  async ({ user, body }) => {
    const { sourceLanguage, targetLanguage } = body;

    await db
      .insert(profiles)
      .values({
        id: user.id,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
        },
      });

    await syncDeckStudies(user.id, targetLanguage);

    return NextResponse.json({
      message: "Profile saved successfully",
    });
  },
);

// PUT is just an alias for POST for this endpoint
export const PUT = POST;
