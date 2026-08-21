import { z } from "zod";

import { LanguageCodeSchema } from "./languages";

/**
 * Wire-format schema for a profile. Hand-written so client components do not
 * pull the Drizzle table definition into the browser bundle; kept honest by
 * `src/types/test/schema-parity.test.ts`.
 */
export const ProfileSchema = z.object({
  id: z.string(),
  sourceLanguage: LanguageCodeSchema,
  targetLanguage: LanguageCodeSchema,
  createdAt: z.string().nullable(),
});
export type Profile = z.infer<typeof ProfileSchema>;
