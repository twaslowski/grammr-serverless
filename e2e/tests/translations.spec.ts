import { expect, test } from "@playwright/test";
import { getTestData, testTargetLanguages } from "../test-data";

// Run translation tests for each target language
for (const targetLanguage of testTargetLanguages) {
  const testData = getTestData(targetLanguage);

  test.describe(`Translations Page - ${testData.name}`, () => {
    // Use the language-specific authentication
    test.use({
      storageState: `e2e/.auth/user-${targetLanguage}.json`,
    });

    // test("should display translation for a sentence", async ({ page }) => {
    //   // Navigate to the translations page
    //   await page.goto("/dashboard/translate");
    //
    //   // Enter a sample sentence
    //   await page
    //     .getByPlaceholder(/Enter text/i)
    //     .fill(testData.translations.sampleSentence);
    //
    //   // Submit the form
    //   await page.getByRole("button", { name: /Translate/i }).click();
    //
    //   // Wait for loading to complete
    //   await expect(
    //     page.getByRole("button", { name: /Translating/i }),
    //   ).not.toBeVisible({
    //     timeout: 10000,
    //   });
    //
    //   // Verify that the translation result is visible
    //   // Check for word-by-word breakdown
    //   for (const word of testData.translations.expectedWords) {
    //     await expect(page.getByText(word, { exact: false })).toBeVisible();
    //   }
    // });

    test("should display analysis for a sentence", async ({ page }) => {
      // Navigate to the translations page
      await page.goto("/dashboard/translate");

      // Verify we're in the correct mode - should show "Translation Mode" by default
      // Click the swap button to switch to Analysis Mode
      const swapButton = page.getByRole("button", { name: "Swap languages" });

      // Check if we need to toggle to Analysis Mode
      const modeText = await page.getByText(/Mode/).textContent();
      if (modeText?.includes("Translation Mode")) {
        await swapButton.click();
        // Wait for mode to change
        await expect(page.getByText("Analysis Mode")).toBeVisible();
      }

      // Enter a sample sentence in the target language (for analysis)
      await page
          .getByPlaceholder(/Enter text/i)
          .fill(testData.translations.sampleSentence);

      // Submit the form
      await page.getByRole("button", { name: /Translate/i }).click();

      // Wait for loading to complete
      await expect(
          page.getByRole("button", { name: /Translating/i }),
      ).not.toBeVisible({
        timeout: 10000,
      });

      // Verify that the translation result is visible
      // Check for word-by-word breakdown
      for (const word of testData.translations.expectedWords) {
        await expect(page.getByRole('heading', { name: word })).toBeVisible();
      }
    });

  });
}
