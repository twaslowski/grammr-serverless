import { and, eq } from "drizzle-orm";

import { db } from "@/db/connect";
import { decks, deckStudy } from "@/db/schemas/schema";
import { LanguageCode } from "@/types/languages";

/**
 * Deck-subscription helpers, shared by the profile route and by
 * `ensureProfile`.
 *
 * They live here rather than in `src/app/api/v1/profile/route.ts` because a
 * Server Component (the dashboard layout, via `ensureProfile`) must not import a
 * route module: doing so drags the route's handler exports into the component
 * graph.
 */

/**
 * Subscribes a user to every public deck in a language.
 *
 * Called once, when a profile is first created. Re-running it is harmless — the
 * upsert is idempotent — but it costs a scan of every public deck, so callers
 * should not put it on a hot path.
 */
export const syncDeckStudies = async (
  userId: string,
  language: LanguageCode,
) => {
  const publicDecks = await getPublicDecks(language);

  await Promise.all(publicDecks.map((deck) => studyDeck(userId, deck.id)));
};

export const getPublicDecks = async (language: LanguageCode) => {
  return db
    .select()
    .from(decks)
    .where(and(eq(decks.language, language), eq(decks.visibility, "public")));
};

export const studyDeck = async (userId: string, deckId: number) => {
  await db
    .insert(deckStudy)
    .values({
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
