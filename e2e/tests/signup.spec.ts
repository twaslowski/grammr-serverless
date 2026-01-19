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

  test("should redirect user to language selection if profile does not exist", async ({
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

    // Wait for navigation to language selection page (since profile doesn't exist yet)
    await page.waitForURL("/auth/sign-up/select-language");

    // Verify error page is never shown
    await expect(page.getByText(/Something went wrong/i)).not.toBeVisible();

    // Define all protected routes that should redirect to language selection
    const protectedRoutes = [
      "/dashboard",
      "/dashboard/flashcards",
      "/dashboard/tools",
      "/dashboard/inflect",
      "/dashboard/translate",
    ];

    // Test each protected route
    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should be redirected to language selection page
      await page.waitForURL("/auth/sign-up/select-language");

      // Verify error page is never shown
      await expect(page.getByText(/Something went wrong/i)).not.toBeVisible();

      // Verify we're on the language selection page
      await expect(
        page.getByText(/Which language are you learning/i),
      ).toBeVisible();
    }
  });
});
