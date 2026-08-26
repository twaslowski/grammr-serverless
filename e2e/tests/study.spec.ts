import { expect, test } from "@playwright/test";

import { getTestData, testTargetLanguages } from "../test-data";

/**
 * Contract tests for the study endpoints.
 *
 * These go through the API rather than the UI: the study session's payload is
 * the one place where a `flashcard_study` row, the FSRS scheduler and the client
 * all have to agree on field names, and the UI would not tell us which of them
 * drifted.
 */
for (const targetLanguage of testTargetLanguages) {
  const testData = getTestData(targetLanguage);

  test.describe(`Study - ${testData.name}`, () => {
    test.use({ storageState: `e2e/.auth/user-${targetLanguage}.json` });

    test("serves a scheduled card and records a review", async ({
      request,
    }) => {
      // Inserting a flashcard fires the trigger that creates its study row.
      const created = await request.post("/api/v1/flashcards", {
        data: {
          front: testData.inflections.verb?.word ?? "test",
          back: { type: "phrase", translation: "to test" },
        },
      });
      expect(created.status()).toBe(201);

      const session = await request.get("/api/v1/study?limit=1");
      expect(session.status()).toBe(200);

      const { cards } = await session.json();
      expect(cards.length).toBeGreaterThan(0);

      const [{ card, schedulingOptions }] = cards;

      // The row travels as-is, so the wire names are the column names.
      expect(card).toMatchObject({
        flashcardId: expect.any(Number),
        deckId: expect.any(Number),
        userId: expect.any(String),
        elapsedDays: expect.any(Number),
        scheduledDays: expect.any(Number),
        learningSteps: expect.any(Number),
        state: expect.any(String),
      });
      expect(card.flashcard.language).toBe(targetLanguage);

      // One option per rating, each labelled from its real due date rather than
      // `scheduledDays` — which is 0 for every intra-day learning step.
      expect(schedulingOptions.map((o: { rating: string }) => o.rating)).toEqual(
        ["Again", "Hard", "Good", "Easy"],
      );
      for (const option of schedulingOptions) {
        expect(option.nextReviewInterval).toMatch(/\d+(\.\d+)? (minute|hour|day|month|year)s?/);
      }

      const review = await request.post(`/api/v1/study/${card.id}/review`, {
        data: { rating: "Good" },
      });
      expect(review.status()).toBe(200);

      const { success, updatedCard, reviewLog } = await review.json();
      expect(success).toBe(true);
      expect(updatedCard.id).toBe(card.id);
      expect(updatedCard.reps).toBe(card.reps + 1);
      expect(reviewLog).toMatchObject({
        flashcardStudyId: card.id,
        rating: "Good",
        lastElapsedDays: expect.any(Number),
      });
    });
  });
}
