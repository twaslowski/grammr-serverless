import { test as setup } from "@playwright/test";
import { randomUUID } from "crypto";
import { generateTestEmail, testTargetLanguages } from "./test-data";

const testPassword = "TestPassword123!";

// Create a setup test for each target language
for (const targetLanguage of testTargetLanguages) {
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

    // There is no language wizard any more: the dashboard layout provisions the
    // profile (English → Russian) and its default deck on first load.
    await page.waitForURL("/dashboard");

    // Save authentication state for this language
    await page.context().storageState({ path: authFile });
  });
}
