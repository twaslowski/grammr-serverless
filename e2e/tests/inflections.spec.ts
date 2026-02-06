import { expect, test } from "@playwright/test";
import { getTestData, testTargetLanguages } from "../test-data";

// Run inflection tests for each target language that supports inflections
for (const targetLanguage of testTargetLanguages) {
  const testData = getTestData(targetLanguage);

  // Only test inflections if the language has inflection data
  if (!testData.inflections || Object.keys(testData.inflections).length === 0) {
    continue;
  }

  test.describe(`Inflections Page - ${testData.name}`, () => {
    // Use the language-specific authentication
    test.use({
      storageState: `e2e/.auth/user-${targetLanguage}.json`,
    });

    // Test noun inflections if available
    if (testData.inflections.noun) {
      test("should handle noun inflections", async ({ page }) => {
        // Navigate to the inflections page
        await page.goto("/dashboard/inflect");

        // Find the word input field and enter a word
        await page.getByLabel(/Word/i).fill(testData.inflections.noun!.word);

        if (testData.inflections.distinguishPos) {
          await page.getByRole("button", {name: "Noun"}).click();
        }

        // Submit the form
        await page.getByRole("button", { name: "Inflect" }).click();

        // Wait for loading to complete
        await expect(
          page.getByRole("button", { name: /Inflecting/i }),
        ).not.toBeVisible({
          timeout: 10000,
        });

        // Check for expected case labels in the table
        for (const caseLabel of testData.inflections.noun!.expectedCases) {
          await expect(page.getByText(caseLabel)).toBeVisible();
        }
      });
    }

    // Test verb inflections if available
    if (testData.inflections.verb) {
      test("should handle verb inflections", async ({ page }) => {
        await page.goto("/dashboard/inflect");

        // Enter a verb
        await page.getByLabel(/Word/i).fill(testData.inflections.verb!.word);

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

        // Verify verb-specific content is displayed
        await expect(
          page.getByText(testData.inflections.verb!.word),
        ).toBeVisible();

        // Check for expected person labels
        for (const person of testData.inflections.verb!.expectedPersons) {
          await expect(page.getByText(person)).toBeVisible();
        }
      });
    }

    // Test adjective inflections if available
    if (testData.inflections.adjective) {
      test("should handle adjective inflections", async ({ page }) => {
        await page.goto("/dashboard/inflect");

        // Enter an adjective
        await page
          .getByLabel(/Word/i)
          .fill(testData.inflections.adjective!.word);

        if (testData.inflections.distinguishPos) {
          await page.getByRole("button", {name: "Adjective"}).click();
        }

        // Submit the form
        await page.getByRole("button", { name: "Inflect" }).click();

        // Wait for loading to complete
        await expect(
          page.getByRole("button", { name: /Inflecting/i }),
        ).not.toBeVisible({
          timeout: 10000,
        });

        // Check for expected case labels
        for (const caseLabel of testData.inflections.adjective!
          .expectedCases) {
          await expect(page.getByText(caseLabel)).toBeVisible();
        }
      });
    }

    // Test error handling for invalid input
    test("should show error for invalid input", async ({ page }) => {
      await page.goto("/dashboard/inflect");

      // Enter an invalid word
      await page.getByLabel(/Word/i).fill(testData.invalidWord);

      // Submit the form
      await page.getByRole("button", { name: "Inflect" }).click();

      // Wait for the request to complete
      await expect(
        page.getByRole("button", { name: /Inflecting/i }),
      ).not.toBeVisible({
        timeout: 10000,
      });

      // Should show an error message
      await expect(page.getByText(/Error/i)).toBeVisible();
    });
  });
}
