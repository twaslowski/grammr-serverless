"use client";

import { useProfile } from "@/components/dashboard/profile-provider";
import { usePreflightWarmup } from "@/components/dashboard/use-preflight-warmup";
import { DictionarySearch } from "@/components/dictionary";
import { PageLayout } from "@/components/page-header";
import { getLanguageByCode } from "@/lib/languages";

export default function DictionaryPage() {
  const profile = useProfile();
  const languageInfo = getLanguageByCode(profile.targetLanguage);

  // The dictionary's cold start includes pulling a SQLite artifact out of S3, so
  // this matters more here than on the pages it was added for.
  usePreflightWarmup(profile.targetLanguage);

  return (
    <PageLayout
      header={{
        title: "Dictionary",
        description:
          "Look up any word. Inflected forms resolve to their dictionary form, and words that do not inflect are still defined.",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <div className="flex w-full justify-center">
        {languageInfo?.dictionaryEnabled ? (
          <DictionarySearch
            languageCode={languageInfo.code}
            languageName={languageInfo.name}
          />
        ) : (
          <LanguageNotSupported language={languageInfo?.name} />
        )}
      </div>
    </PageLayout>
  );
}

/**
 * Reached when the reader's target language has no published artifact.
 *
 * Unlike the equivalent on the inflection page, this is a real state rather than
 * a "should never be called" branch: the dictionary is rolled out one language at
 * a time, so it points at the tool that does cover them.
 */
function LanguageNotSupported({ language }: { language?: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-lg">
        The dictionary does not cover {language ?? "your language"} yet.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Inflection tables are still available in the meantime.
      </p>
      <a
        href="/dashboard/inflect"
        className="mt-4 block text-primary underline"
      >
        Go to inflections
      </a>
    </div>
  );
}
