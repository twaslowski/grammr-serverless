import { expect, test } from "@playwright/test";

import { getTestData, testTargetLanguages } from "../test-data";

/**
 * The dictionary, exercised against the four answers it has to be able to give:
 * a headword, an inflected form, a word with no paradigm, and a word it does not
 * know. The last two are the ones the inflection form could only report as
 * errors.
 */
for (const targetLanguage of testTargetLanguages) {
  const testData = getTestData(targetLanguage);
  const dictionary = testData.dictionary;

  // Only languages with a published artifact.
  if (!dictionary) {
    continue;
  }

  test.describe(`Dictionary Page - ${testData.name}`, () => {
    test.use({
      storageState: `e2e/.auth/user-${targetLanguage}.json`,
    });

    /** Types a query and waits for the debounced lookup to settle. */
    const search = async (
      page: import("@playwright/test").Page,
      term: string,
    ) => {
      await page.goto("/dashboard/dictionary");
      await page
        .getByRole("searchbox", { name: new RegExp(testData.name, "i") })
        .fill(term);
    };

    test("looks up a headword and shows its table", async ({ page }) => {
      await search(page, dictionary.lemma);

      // No part of speech was supplied, and none was asked for.
      await expect(
        page.getByRole("heading", { level: 2, name: dictionary.lemma }),
      ).toBeVisible({ timeout: 30000 });

      for (const caseLabel of dictionary.expectedCases) {
        await expect(page.getByText(caseLabel).first()).toBeVisible();
      }
    });

    test("resolves an inflected form to its dictionary form", async ({
      page,
    }) => {
      // The case the old form answered with a POS-mismatch error.
      await search(page, dictionary.inflectedForm);

      await expect(page.getByText(/dictionary form of/)).toBeVisible({
        timeout: 30000,
      });
      await expect(
        page.getByRole("heading", { level: 2, name: dictionary.lemma }),
      ).toBeVisible();
    });

    test("defines a word that does not inflect", async ({ page }) => {
      // An adverb has a meaning and no table. The old form had nothing to show.
      await search(page, dictionary.uninflectedWord);

      await expect(
        page.getByRole("heading", {
          level: 2,
          name: new RegExp(dictionary.uninflectedWord),
        }),
      ).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(/do not inflect/)).toBeVisible();
      await expect(page.getByText("Nominative")).not.toBeVisible();
    });

    test("offers every reading of a homograph", async ({ page }) => {
      // Rather than picking one and being wrong, or erroring out.
      await search(page, dictionary.homograph);

      await expect(page.getByText(/entries for/)).toBeVisible({
        timeout: 30000,
      });
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: new RegExp(dictionary.homograph),
        }),
      ).toHaveCount(2);
    });

    test("reports an unknown word as an empty result, not an error", async ({
      page,
    }) => {
      await search(page, testData.invalidWord);

      await expect(page.getByText(/No entry for/)).toBeVisible({
        timeout: 30000,
      });
      await expect(page.getByText(/Something went wrong/)).not.toBeVisible();
    });

    test("attributes entries to Wiktionary under CC BY-SA", async ({ page }) => {
      // The licence obliges it, so it is worth a test rather than a convention.
      await search(page, dictionary.lemma);

      await expect(
        page.getByRole("link", { name: "Wiktionary" }).first(),
      ).toBeVisible({ timeout: 30000 });
      await expect(
        page.getByRole("link", { name: "CC BY-SA 4.0" }).first(),
      ).toBeVisible();
    });
  });
}
