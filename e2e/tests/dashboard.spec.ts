import { expect, test } from "@playwright/test";

import { getTestData, testTargetLanguages } from "../test-data";

/**
 * Contract tests for the Study tab's idle dashboard.
 *
 * The stats endpoint is the one place where the `review_log → flashcard_study`
 * join and the `AT TIME ZONE` day projection are exercised, and neither can be
 * covered by Jest: both need a database. The pure arithmetic on top of them —
 * gap-filling, streak-free retention deltas, the empty-window rules — is
 * unit-tested in `src/lib/stats/test`, so what is left for here is the SQL.
 */
for (const targetLanguage of testTargetLanguages) {
  const testData = getTestData(targetLanguage);

  test.describe(`Dashboard - ${testData.name}`, () => {
    test.use({ storageState: `e2e/.auth/user-${targetLanguage}.json` });

    test("aggregates the collection and the forecast", async ({ request }) => {
      const response = await request.get(
        "/api/v1/study/stats?tz=Europe%2FBerlin",
      );
      expect(response.status()).toBe(200);

      const stats = await response.json();

      // The zone is echoed so the payload explains its own day boundaries.
      expect(stats.timeZone).toBe("Europe/Berlin");

      expect(stats.collection).toMatchObject({
        total: expect.any(Number),
        new: expect.any(Number),
        learning: expect.any(Number),
        review: expect.any(Number),
        relearning: expect.any(Number),
        dueNow: expect.any(Number),
      });

      // The four states partition the collection; if they stop adding up, the
      // stacked bar is drawing a lie.
      const {
        total,
        new: unseen,
        learning,
        review,
        relearning,
      } = stats.collection;
      expect(unseen + learning + review + relearning).toBe(total);

      // Always exactly seven contiguous local days, today first.
      expect(stats.forecast).toHaveLength(7);
      for (const [index, bucket] of stats.forecast.entries()) {
        expect(bucket.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(bucket.count).toEqual(expect.any(Number));
        if (index > 0) {
          expect(bucket.day > stats.forecast[index - 1].day).toBe(true);
        }
      }

      // `nextDue` is formatted in SQL with an explicit Z, because the column is
      // naive UTC and letting JS parse it would reintroduce local-time skew.
      if (stats.collection.nextDue !== null) {
        expect(stats.collection.nextDue).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
        );
      }
    });

    test("counts a review through the join to flashcard_study", async ({
      request,
    }) => {
      const before = await (
        await request.get("/api/v1/study/stats?tz=UTC")
      ).json();

      // Inserting a flashcard fires the trigger that creates its study row.
      const created = await request.post("/api/v1/flashcards", {
        data: {
          front: testData.inflections.verb?.word ?? "test",
          back: { type: "phrase", translation: "to test" },
        },
      });
      expect(created.status()).toBe(201);

      const session = await request.get("/api/v1/study?limit=1");
      const { cards } = await session.json();
      expect(cards.length).toBeGreaterThan(0);

      const review = await request.post(
        `/api/v1/study/${cards[0].card.id}/review`,
        { data: { rating: "Good" } },
      );
      expect(review.status()).toBe(200);

      const after = await (
        await request.get("/api/v1/study/stats?tz=UTC")
      ).json();

      // `review_log` carries no `user_id`; it is only attributable by joining
      // through `flashcard_study`. This assertion is that join.
      //
      // Monotonic rather than exactly `+1`: the browser projects run in
      // parallel against the *same* per-language account, so two of them can
      // interleave a review between this test's before and after reads. An
      // exact delta would fail on a race that says nothing about the query.
      expect(after.retention.reviews).toBeGreaterThan(before.retention.reviews);
      expect(after.retention.good).toBeGreaterThan(before.retention.good);
      expect(after.retention.rate).not.toBeNull();
      expect(after.retention.rate).toBeGreaterThan(0);
    });

    test("rejects an unknown time zone rather than falling back to UTC", async ({
      request,
    }) => {
      // The value reaches SQL inside an AT TIME ZONE expression. A caller that
      // thinks it asked for Berlin must not be handed plausible-looking UTC.
      const response = await request.get(
        "/api/v1/study/stats?tz=Nowhere%2FFake",
      );

      expect(response.status()).toBe(400);
    });

    test("shows the idle view on the Study tab", async ({ page }) => {
      await page.goto("/dashboard?dashboard=1");

      await expect(
        page.getByRole("heading", { name: /All caught up|Your deck is empty/ }),
      ).toBeVisible();
    });

    test("does not overflow a phone viewport", async ({ page }) => {
      await page.goto("/dashboard?dashboard=1");
      await expect(
        page.getByRole("heading", { name: /All caught up|Your deck is empty/ }),
      ).toBeVisible();

      // The charts are hand-rolled divs with percentage widths, so horizontal
      // overflow is the regression this feature is most likely to introduce.
      // Matters most under `mobile-ru` (Pixel 7, 412px).
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
