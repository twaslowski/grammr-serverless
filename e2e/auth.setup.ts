import { expect,test as setup } from "@playwright/test";
import { randomUUID } from "crypto";

const authFile = "e2e/.auth/user.json";

// Generate a unique email for each test run to avoid conflicts
const testEmail = `test-${randomUUID()}@example.com`;
const testPassword = "TestPassword123!";

setup("authenticate", async ({ page }) => {
  // Navigate to signup page
  await page.goto("/auth/sign-up");

  // Fill in signup form
  await page.getByLabel("Email").fill(testEmail);
  await page.getByLabel("Password", { exact: true }).fill(testPassword);
  await page.getByLabel("Repeat Password").fill(testPassword);

  // Submit the form
  await page.getByRole("button", { name: "Sign up" }).click();

  // Wait for navigation to language selection page
  await page.waitForURL("/auth/sign-up/select-language");

  // Select a language (Russian)
  await page.getByRole("button", { name: /Russian/i }).click();

  // Click continue
  await page.getByRole("button", { name: /Continue/i }).click();

  // Wait for navigation to dashboard
  await page.waitForURL("/dashboard");

  // Verify we're on the dashboard
  await expect(
    page.getByRole("heading", { name: /Welcome back/i }),
  ).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
