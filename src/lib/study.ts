import { apiFetch, createValidatedFetcher } from "@/lib/api/validated-fetcher";
import {
  DueCardsCount,
  DueCardsCountSchema,
  Rating,
  StudySession,
  StudySessionSchema,
  SubmitReviewResponse,
} from "@/types/fsrs";

const BASE_URL = "/api/v1/study";

const fetchDueCardsCount = createValidatedFetcher(DueCardsCountSchema);
const fetchSession = createValidatedFetcher(StudySessionSchema);

/**
 * Fetch the count of due cards for study
 */
export async function getDueCardsCount(
  includeNew: boolean = true,
): Promise<DueCardsCount> {
  const params = new URLSearchParams();
  params.set("include_new", String(includeNew));

  return fetchDueCardsCount(`${BASE_URL}/due?${params}`, { method: "GET" });
}

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
  return apiFetch(
    `${BASE_URL}/${cardId}/review`,
    { method: "POST", body: JSON.stringify({ rating }) },
    "Failed to submit review",
  );
}
