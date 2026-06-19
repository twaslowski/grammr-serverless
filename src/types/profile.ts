import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { profiles } from "@/db/schemas/schema";

import { LanguageCodeSchema } from "./languages";

export const ProfileSchema = createSelectSchema(profiles, {
  sourceLanguage: LanguageCodeSchema,
  targetLanguage: LanguageCodeSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;
