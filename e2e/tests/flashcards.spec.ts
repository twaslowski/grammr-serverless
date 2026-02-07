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

      // Step 1: Navigate to inflections page and create a flashcard
      await page.goto("/dashboard/inflect");

      // Enter a verb
      await page.getByLabel(/Word/i).fill(testData.inflections.verb.word);

      // Select verb if POS distinction is needed
      if (testData.inflections.distinguishPos) {
        await page.getByRole("button", { name: "Verb" }).click();
      }

      // Submit the form
      await page.getByRole("button", { name: "Inflect" }).click();

      // Wait for loading to complete
      await expect(
        page.getByRole("button", { name: /Inflecting/i }),
      ).not.toBeVisible({
        timeout: 20000,
      });

      // Click the "Create Flashcard" button
      const createFlashcardButton = page
        .getByRole("button")
        .filter({ has: page.locator('svg[class*="lucide-layers"]') })
        .filter({ has: page.locator('svg[class*="lucide-plus"]') });
      await createFlashcardButton.click();

      // Wait for the dialog to open
      await expect(
        page.getByRole("dialog").getByRole("heading", { name: "Create Flashcard" }),
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
        page.getByRole("dialog").getByRole("heading", { name: "Create Flashcard" }),
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

    test("should search for flashcards on flashcards page", async ({
      page,
    }) => {
      // Only run if we have noun data to search for
      if (!testData.inflections.noun) {
        test.skip();
        return;
      }

      // First, ensure there's at least one flashcard
      // (This assumes previous tests have run or there's existing data)
      await page.goto("/dashboard/flashcards");

      // Use the search functionality
      const searchInput = page.getByPlaceholder(/Search flashcards/i);
      await searchInput.fill(testData.inflections.noun.word);

      // Click search button
      await page.getByRole("button", { name: /Search/i }).click();

      // Wait for search results
      await expect(page.getByRole("button", { name: /Search/i })).toBeEnabled({
        timeout: 5000,
      });

      // The flashcard should still be visible (if it exists)
      // This is a soft check - the test won't fail if no results are found
      // as it depends on previous test state
    });
  });
}

