import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { profile } from "@/db/schemas";

import { LanguageCodeSchema } from "./languages";

export const ProfileSchema = createSelectSchema(profile, {
  sourceLanguage: LanguageCodeSchema,
  targetLanguage: LanguageCodeSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;
