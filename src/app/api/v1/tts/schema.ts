import { z } from "zod";

import { LanguageCodeSchema } from "@/types/languages";

export const TTSRequestSchema = z.object({
  text: z
    .string()
    .min(1, "Text cannot be empty")
    .max(5000, "Text exceeds maximum length of 5000 characters"),
  language: LanguageCodeSchema,
});
