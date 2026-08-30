"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useProfile } from "@/components/dashboard/profile-provider";
import { usePreflightWarmup } from "@/components/dashboard/use-preflight-warmup";
import { InflectionForm } from "@/components/inflection";
import { PageLayout } from "@/components/page-header";
import { getLanguageByCode } from "@/lib/languages";

/**
 * The inflection generator, now a fallback rather than the main entrance.
 *
 * Where a dictionary artifact exists, this page redirects to it: asking for a
 * base form and a part of speech up front is the friction the dictionary removes,
 * so there is no reason to keep two doors onto the same paradigms. The form
 * survives for the Romance languages, which have a verb conjugator but no
 * artifact yet, and should be deleted once they do.
 */
export default function InflectionsPage() {
  const profile = useProfile();
  const router = useRouter();
  const languageInfo = getLanguageByCode(profile.targetLanguage);
  const hasDictionary = languageInfo?.dictionaryEnabled ?? false;

  useEffect(() => {
    if (hasDictionary) {
      router.replace("/dashboard/dictionary");
    }
  }, [hasDictionary, router]);

  // Trigger Lambda warmup on page load
  usePreflightWarmup(profile.targetLanguage);

  if (hasDictionary) {
    return null;
  }

  return (
    <PageLayout
      header={{
        title: "Inflect",
        description:
          "Enter a word to see all its inflected forms. Select the part of speech to get accurate inflections.",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <div className="w-full flex justify-center">
        {(languageInfo && languageInfo.inflectionConfig && (
          <InflectionForm
            languageCode={languageInfo.code}
            languageName={languageInfo.name}
            distinguishPos={languageInfo.inflectionConfig.distinguishPos}
            availablePos={languageInfo.inflectionConfig.pos}
          />
        )) || <LanguageNotSupportedPage />}
      </div>
    </PageLayout>
  );
}

// this should never be called
function LanguageNotSupportedPage() {
  return (
    <div className="text-center py-8">
      <p className="text-lg text-red-600">
        Inflections are not supported for your language.
      </p>
      <a href="/dashboard" className="text-blue-600 underline mt-2 block">
        Return to Dashboard
      </a>
    </div>
  );
}
