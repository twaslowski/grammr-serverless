import { defineConfig, devices } from "@playwright/test";

import { languageTestData, testTargetLanguages } from "./e2e/test-data";

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * The target languages and their display names come from `e2e/test-data.ts`,
 * which is the same source the specs use.
 */

/** Specs are titled "... - Russian"; match the ones for this project's language. */
const grepForLanguage = (language: keyof typeof languageTestData) =>
  new RegExp(`- ${languageTestData[language].name}`);

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
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
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

    // One project per browser/language pair. The mobile profile is not
    // redundant with the desktop ones: the tab bar, the safe-area padding and
    // the touch targets only exist below the `md` breakpoint, so a
    // desktop-only suite would never render them.
    ...(["chromium", "firefox", "mobile"] as const).flatMap((browser) =>
      testTargetLanguages.map((lang) => ({
        name: `${browser}-${lang}`,
        use: {
          ...devices[
            browser === "chromium"
              ? "Desktop Chrome"
              : browser === "firefox"
                ? "Desktop Firefox"
                : "Pixel 7"
          ],
          storageState: `e2e/.auth/user-${lang}.json`,
        },
        dependencies: [`setup-${lang}`],
        testDir: "./e2e/tests",
        grep: grepForLanguage(lang),
      })),
    ),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
