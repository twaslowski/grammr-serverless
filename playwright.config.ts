import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import test target languages to create projects
const testTargetLanguages = ["ru", "it", "fr", "es", "pt"];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup projects - runs authentication for each language
    ...testTargetLanguages.map((lang) => ({
      name: `setup-${lang}`,
      testMatch: /auth\.setup\.ts/,
      grep: new RegExp(`authenticate-${lang}`),
    })),

    // Test projects for each language in Chromium
    ...testTargetLanguages.map((lang) => ({
      name: `chromium-${lang}`,
      use: {
        ...devices["Desktop Chrome"],
        storageState: `e2e/.auth/user-${lang}.json`,
      },
      dependencies: [`setup-${lang}`],
      testDir: "./e2e/tests",
      grep: new RegExp(`- ${lang === "ru" ? "Russian" : lang === "it" ? "Italian" : lang === "fr" ? "French" : lang === "es" ? "Spanish" : "Portuguese"}`),
    })),

    // Optional: Firefox projects for each language
    ...testTargetLanguages.map((lang) => ({
      name: `firefox-${lang}`,
      use: {
        ...devices["Desktop Firefox"],
        storageState: `e2e/.auth/user-${lang}.json`,
      },
      dependencies: [`setup-${lang}`],
      testDir: "./e2e/tests",
      grep: new RegExp(`- ${lang === "ru" ? "Russian" : lang === "it" ? "Italian" : lang === "fr" ? "French" : lang === "es" ? "Spanish" : "Portuguese"}`),
    })),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
