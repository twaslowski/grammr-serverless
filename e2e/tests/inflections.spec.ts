import { expect,test } from "@playwright/test";

test.describe("Inflections Page", () => {
  test("should display inflections for a noun", async ({ page }) => {
    // Navigate to the inflections page
    await page.goto("/dashboard/inflect");

    // Verify we're on the inflections page
    await expect(page.getByRole("heading", { name: "Inflect" })).toBeVisible();

    // Find the word input field and enter a word
    await page.getByLabel(/Word/i).fill("кот");

    await page.getByRole("button", { name: "Noun" }).click();

    // Submit the form
    await page.getByRole("button", { name: "Inflect" }).click();

    // Wait for loading to complete
    await expect(
      page.getByRole("button", { name: /Inflecting/i }),
    ).not.toBeVisible({
      timeout: 10000,
    });

    // Check for case labels in the table
    await expect(page.getByText("Nominative")).toBeVisible();
    await expect(page.getByText("Genitive")).toBeVisible();
    await expect(page.getByText("Dative")).toBeVisible();
    await expect(page.getByText("Accusative")).toBeVisible();
    await expect(page.getByText("Instrumental")).toBeVisible();
    await expect(page.getByText("Prepositional")).toBeVisible();
  });

  test("should handle verb inflections", async ({ page }) => {
    await page.goto("/dashboard/inflect");

    // Enter a Russian verb
    await page.getByLabel(/Word/i).fill("читать");

    // Select "Verb" as part of speech
    await page.getByRole("button", { name: "Verb" }).click();

    // Submit the form
    await page.getByRole("button", { name: "Inflect" }).click();

    // Wait for loading to complete
    await expect(
      page.getByRole("button", { name: /Inflecting/i }),
    ).not.toBeVisible({
      timeout: 10000,
    });

    // Verify verb-specific content is displayed
    await expect(page.getByText("читать")).toBeVisible();
    await expect(page.getByText("1st Person")).toBeVisible();
    await expect(page.getByText("2nd Person")).toBeVisible();
    await expect(page.getByText("3rd Person")).toBeVisible();
  });

  test("should show error for invalid input", async ({ page }) => {
    await page.goto("/dashboard/inflect");

    // Enter an invalid word (e.g., in wrong language)
    await page.getByLabel(/Word/i).fill("xyz123");

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
