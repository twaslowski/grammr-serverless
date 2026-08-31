import { createValidatedFetcher } from "@/lib/api/validated-fetcher";
import {
  Rating,
  StudySession,
  StudySessionSchema,
  SubmitReviewResponse,
  SubmitReviewResponseSchema,
} from "@/types/fsrs";

const BASE_URL = "/api/v1/study";

const fetchSession = createValidatedFetcher(StudySessionSchema);
const postReview = createValidatedFetcher(SubmitReviewResponseSchema);

/**
 * Fetch the next card to study with scheduling options
 */
export async function loadSession(limit?: number): Promise<StudySession> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));

  const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;

  return fetchSession(url, { method: "GET" });
}

/**
 * Submit a review for a card
 */
export async function submitReview(
  cardId: number,
  rating: Rating,
): Promise<SubmitReviewResponse> {
  return postReview(`${BASE_URL}/${cardId}/review`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}
