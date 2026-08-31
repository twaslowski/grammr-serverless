import { expect, test } from "@playwright/test";

import { getTestData, testTargetLanguages } from "../test-data";

/**
 * The tab bar is the whole navigation model now — there is no home screen to
 * fall back to — so "can you reach each of the four features" is a real
 * smoke test rather than a formality.
 */
for (const targetLanguage of testTargetLanguages) {
  const testData = getTestData(targetLanguage);

  test.describe(`Navigation - ${testData.name}`, () => {
    test.use({
      storageState: `e2e/.auth/user-${targetLanguage}.json`,
    });

    const TABS = [
      { label: "Study", path: "/dashboard" },
      { label: "Cards", path: "/dashboard/flashcards" },
      { label: "Dictionary", path: "/dashboard/dictionary" },
      { label: "Translate", path: "/dashboard/translate" },
    ];

    test("lands on the study tab", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(
        page.getByRole("navigation", { name: "Main" }).first(),
      ).toBeVisible();
    });

    for (const tab of TABS) {
      test(`navigates to ${tab.label}`, async ({ page }) => {
        await page.goto("/dashboard");

        await page
          .getByRole("navigation", { name: "Main" })
          .first()
          .getByRole("link", { name: tab.label })
          .click();

        await page.waitForURL(tab.path);
        // Exactly one tab is current, and it is this one.
        await expect(
          page
            .getByRole("navigation", { name: "Main" })
            .first()
            .getByRole("link", { name: tab.label }),
        ).toHaveAttribute("aria-current", "page");
      });
    }

    test("keeps the old study URL working", async ({ page }) => {
      await page.goto("/dashboard/study");
      await page.waitForURL("/dashboard");
    });

    test("reaches settings from the user menu", async ({ page }) => {
      await page.goto("/dashboard");

      await page.getByRole("button", { name: "user-menu" }).click();
      await page.getByRole("menuitem", { name: "Settings" }).click();

      await page.waitForURL("/dashboard/settings");
    });
  });
}
