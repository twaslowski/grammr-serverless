import { z } from "zod";

import { RatingEnum } from "@/types/fsrs";

/**
 * Query params for fetching due cards
 */
export const DueCardsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).catch(20),
  include_new: z.coerce.boolean().catch(true),
});

/**
 * Request body for submitting a review
 */
export const SubmitReviewRequestSchema = z.object({
  rating: RatingEnum,
});
