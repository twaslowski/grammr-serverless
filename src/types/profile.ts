import { z } from "zod";

import { LanguageCodeSchema } from "./languages";

export const ProfileSchema = z.object({
  id: z.string(),
  source_language: LanguageCodeSchema,
  target_language: LanguageCodeSchema,
  created_at: z.string(),
});

export type Profile = z.infer<typeof ProfileSchema>;
