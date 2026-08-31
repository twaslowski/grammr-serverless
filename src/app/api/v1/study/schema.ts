import { z } from "zod";

import { RatingEnum } from "@/types/fsrs";

/**
 * Query params for fetching a study batch.
 *
 * `include_new` used to live here for `GET /api/v1/study/due`, which the
 * dashboard's stats endpoint replaced; the session route always backfills with
 * new cards, so there was never a caller that set it to false.
 */
export const StudyBatchQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).catch(20),
});

/**
 * Request body for submitting a review
 */
export const SubmitReviewRequestSchema = z.object({
  rating: RatingEnum,
});
