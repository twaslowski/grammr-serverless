import { eq } from "drizzle-orm";

import { db } from "@/db/connect";
import { profiles } from "@/db/schemas/schema";
import { syncDeckStudies } from "@/lib/server/decks";
import {
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
} from "@/types/languages";
import { Profile, ProfileSchema } from "@/types/profile";

/**
 * Returns the caller's profile, creating it with the defaults if absent.
 *
 * This replaces the sign-up language wizard: there is nothing to ask, so the
 * profile is provisioned on first sight of the user instead. The default deck
 * still comes from the `handle_new_profile()` trigger, which fires in the same
 * transaction as the insert below — so by the time this returns, the deck
 * exists.
 *
 * Two properties are load-bearing:
 *
 * 1. **`onConflictDoNothing`, never `onConflictDoUpdate`.** An existing user's
 *    language pair is theirs; this function runs on every dashboard load, and an
 *    upsert here would reset it on each one.
 * 2. **`syncDeckStudies` only on the create branch.** It scans every public deck
 *    in the language, which is not something to pay for on every page view. A
 *    returning user's subscriptions are already in `deck_study`.
 *
 * Concurrent first requests are serialised by the `ON CONFLICT` row lock, so
 * exactly one profile — and therefore one default deck — is created.
 */
export async function ensureProfile(userId: string): Promise<Profile> {
  const [created] = await db
    .insert(profiles)
    .values({
      id: userId,
      sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
      targetLanguage: DEFAULT_TARGET_LANGUAGE,
    })
    .onConflictDoNothing({ target: profiles.id })
    .returning();

  if (created) {
    await syncDeckStudies(userId, created.targetLanguage);
    return ProfileSchema.parse(created);
  }

  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return ProfileSchema.parse(existing);
}
