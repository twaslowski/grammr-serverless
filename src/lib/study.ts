import {
  DueCardsCount,
  Rating,
  StudySession,
  StudySessionSchema,
  SubmitReviewResponse,
} from "@/types/fsrs";

const BASE_URL = "/api/v1/study";

/**
 * Fetch the count of due cards for study
 */
export async function getDueCardsCount(
  includeNew: boolean = true,
): Promise<DueCardsCount> {
  const params = new URLSearchParams();
  params.set("include_new", String(includeNew));

  const response = await fetch(`${BASE_URL}/due?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch due cards count");
  }

  return response.json();
}

/**
 * Fetch the next card to study with scheduling options
 */
export async function loadSession(limit?: number): Promise<StudySession> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));

  const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch study card");
  }

  const parsed = StudySessionSchema.safeParse(await response.json());

  if (parsed.error) {
    console.error(parsed.error);
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}

/**
 * Submit a review for a card
 */
export async function submitReview(
  cardId: number,
  rating: Rating,
): Promise<SubmitReviewResponse> {
  const response = await fetch(`${BASE_URL}/${cardId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to submit review");
  }

  return response.json();
}
