import { expect, test } from "@playwright/test";
import { getTestData, testTargetLanguages } from "../test-data";

// Run flashcard tests for each target language
for (const targetLanguage of testTargetLanguages) {
  const testData = getTestData(targetLanguage);

  // Only test flashcards if the language has inflection data (for creation flow)
  if (!testData.inflections || Object.keys(testData.inflections).length === 0) {
    continue;
  }

  test.describe(`Flashcards Page - ${testData.name}`, () => {
    // Use the language-specific authentication
    test.use({
      storageState: `e2e/.auth/user-${targetLanguage}.json`,
    });

    test("should create paradigm flashcard and show in dashboard due cards", async ({
      page,
    }) => {
      // Only run if verb inflection data exists
      if (!testData.inflections.verb) {
        test.skip();
        return;
      }

      // Step 1: get a paradigm on screen. The dictionary is the only way in
      // now -- the inflection form is gone -- and it needs neither a part of
      // speech nor a submit.
      await page.goto("/dashboard/dictionary");
      await page
        .getByRole("searchbox", { name: new RegExp(testData.name, "i") })
        .fill(testData.inflections.verb.word);
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: new RegExp(testData.inflections.verb.word),
        }),
      ).toBeVisible({ timeout: 30000 });

      // Click the "Create Flashcard" button
      const createFlashcardButton = page
        .getByRole("button")
        .filter({ has: page.locator('svg[class*="lucide-layers"]') })
        .filter({ has: page.locator('svg[class*="lucide-plus"]') })
        // The dictionary lists one control per entry; the first belongs to the
        // best-ranked one, which is the verb being looked up.
        .first();
      await createFlashcardButton.click();

      // Wait for the dialog to open
      await expect(
        page
          .getByRole("dialog")
          .getByRole("heading", { name: "Create Flashcard" }),
      ).toBeVisible();

      // Fill in the translation
      const translationInput = page.getByPlaceholder(/translation/i);
      await translationInput.fill("verb translation");

      // Submit the flashcard creation
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Create Flashcard" })
        .click();

      // Wait for success
      await expect(
        page
          .getByRole("dialog")
          .getByRole("heading", { name: "Create Flashcard" }),
      ).not.toBeVisible({
        timeout: 5000,
      });

      // Step 2: Navigate to dashboard and check due cards count
      await page.goto("/dashboard");

      // Wait for the due cards component to load
      // The component should show at least 1 card due (the one we just created)
      await expect(
        page.getByRole("button", { name: /Study Now/i }),
      ).toBeVisible({
        timeout: 1000,
      });
    });

    /**
     * Seeds through the API rather than the UI: this is about the list, and
     * creating 30 cards by hand through the dialog would be a different test
     * that also happened to be slow.
     */
    test("searches and pages through a long list", async ({
      page,
      request,
    }) => {
      const marker = `zz-page-${Date.now()}`;
      const needle = `${marker}-needle`;

      for (let i = 0; i < 30; i++) {
        const response = await request.post("/api/v1/flashcards", {
          data: {
            front: i === 0 ? needle : `${marker}-${i}`,
            back: { type: "phrase", translation: `translation ${i}` },
          },
        });
        expect(response.status()).toBe(201);
      }

      await page.goto("/dashboard/flashcards");

      // The first page is capped, so the 30 just-seeded cards cannot all be
      // present until "Load more" has been used.
      const firstPage = page.getByText(new RegExp(`^${marker}-`));
      await expect(firstPage.first()).toBeVisible({ timeout: 15000 });
      const firstPageCount = await firstPage.count();
      expect(firstPageCount).toBeLessThanOrEqual(25);

      await page.getByRole("button", { name: /load more/i }).click();
      await expect
        .poll(async () => firstPage.count(), { timeout: 15000 })
        .toBeGreaterThan(firstPageCount);

      // Searching narrows to the single marked card.
      await page.getByLabel("Search flashcards").fill(needle);
      await expect(page.getByText(needle)).toBeVisible({ timeout: 15000 });
      await expect
        .poll(async () => page.getByText(new RegExp(`^${marker}-`)).count(), {
          timeout: 15000,
        })
        .toBe(1);
    });
  });
}
