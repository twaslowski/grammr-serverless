"use client";

import { useProfile } from "@/components/dashboard/profile-provider";
import { usePreflightWarmup } from "@/components/dashboard/use-preflight-warmup";
import { DictionarySearch } from "@/components/dictionary";
import { PageLayout } from "@/components/page-header";
import { getLanguageByCode } from "@/lib/languages";
import { DEFAULT_TARGET_LANGUAGE } from "@/types/languages";

export default function DictionaryPage() {
  const profile = useProfile();

  // Every user learns Russian, which has a published artifact; the fallback is
  // only here because `getLanguageByCode` is nullable.
  const languageInfo =
    getLanguageByCode(profile.targetLanguage) ??
    getLanguageByCode(DEFAULT_TARGET_LANGUAGE)!;

  // The dictionary's cold start includes pulling a SQLite artifact out of S3, so
  // this matters more here than on the pages it was added for.
  usePreflightWarmup(languageInfo.code);

  return (
    <PageLayout
      header={{
        title: "Dictionary",
        description:
          "Look up any word. Inflected forms resolve to their dictionary form, and words that do not inflect are still defined.",
      }}
    >
      <div className="flex w-full justify-center">
        <DictionarySearch
          languageCode={languageInfo.code}
          languageName={languageInfo.name}
        />
      </div>
    </PageLayout>
  );
}
