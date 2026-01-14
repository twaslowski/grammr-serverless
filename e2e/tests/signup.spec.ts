import { test, expect } from "@playwright/test";
import { randomUUID } from "crypto";

// This test runs without authentication to test the signup flow itself
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("User Signup Flow", () => {
  test("should allow a new user to sign up and select language", async ({
    page,
  }) => {
    // Generate unique email for this test
    const uniqueEmail = `signup-test-${randomUUID()}@example.com`;
    const password = "TestPassword123!";

    // Navigate to signup page
    await page.goto("/auth/sign-up");

    // Fill in signup form
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Repeat Password").fill(password);

    // Submit the form
    await page.getByRole("button", { name: "Sign up" }).click();

    // Wait for navigation to language selection page
    await page.waitForURL("/auth/sign-up/select-language");

    // Verify language selection page content
    await expect(
      page.getByText(/Which language are you learning/i),
    ).toBeVisible();

    // Select Russian language
    await page.getByRole("button", { name: /Russian/i }).click();

    // Click continue
    await page.getByRole("button", { name: /Continue/i }).click();

    // Wait for navigation to dashboard
    await page.waitForURL("/dashboard");

    // Verify user can access the dashboard
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
  });
});
