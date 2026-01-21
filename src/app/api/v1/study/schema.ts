import { z } from "zod";
import { RatingEnum } from "@/types/fsrs";

/**
 * Query params for fetching due cards
 */
export const DueCardsQuerySchema = z.object({
  // searchParams.get("<key>") returns null, not undefined; to properly use the default value, .nullable() is required
  limit: z.coerce.number().min(1).max(100).optional().nullable().default(20),
  include_new: z.coerce.boolean().optional().default(true),
});
export type DueCardsQuery = z.infer<typeof DueCardsQuerySchema>;

/**
 * Request body for submitting a review
 */
export const SubmitReviewRequestSchema = z.object({
  rating: RatingEnum,
});
export type SubmitReviewRequest = z.infer<typeof SubmitReviewRequestSchema>;

/**
 * Query params for starting a study session
 */
export const StudySessionQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().nullable().default(20),
});
export type StudySessionQuery = z.infer<typeof StudySessionQuerySchema>;
