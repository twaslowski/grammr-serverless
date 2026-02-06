import { expect, test as setup } from "@playwright/test";
import { randomUUID } from "crypto";
import {
  generateTestEmail,
  getTestData,
  testTargetLanguages,
} from "./test-data";

const testPassword = "TestPassword123!";

// Create a setup test for each target language
for (const targetLanguage of testTargetLanguages) {
  const testData = getTestData(targetLanguage);
  const authFile = `e2e/.auth/user-${targetLanguage}.json`;

  setup(`authenticate-${targetLanguage}`, async ({ page }) => {
    // Generate a unique email for this test run
    const uuid = randomUUID();
    const testEmail = generateTestEmail(targetLanguage, uuid);

    // Navigate to signup page
    await page.goto("/auth/sign-up");

    // Fill in signup form
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password", { exact: true }).fill(testPassword);
    await page.getByLabel("Repeat Password").fill(testPassword);

    // Submit the form
    await page.getByRole("button", { name: "sign-up" }).click();

    // Wait for navigation to language selection page
    await page.waitForURL("/auth/sign-up/select-language");

    // Get source language info
    const sourceLanguageInfo = getTestData(testData.sourceLanguage);

    // Select source language
    await page
      .getByRole("button", { name: new RegExp(sourceLanguageInfo.name, "i") })
      .click();

    // Click continue to go to step 2 (target language selection)
    await page.getByRole("button", { name: /Continue/i }).first().click();

    // Wait for step 2 to be visible
    await expect(
      page.getByText("Which language are you learning?"),
    ).toBeVisible();

    // Select target language
    await page
      .getByRole("button", { name: new RegExp(testData.name, "i") })
      .click();

    // Click continue
    await page.getByRole("button", { name: /Continue/i }).click();

    // Wait for navigation to dashboard
    await page.waitForURL("/dashboard");

    // Verify we're on the dashboard
    await expect(
      page.getByRole("heading", { name: /Welcome back/i }),
    ).toBeVisible();

    // Save authentication state for this language
    await page.context().storageState({ path: authFile });
  });
}
