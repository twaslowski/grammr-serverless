"use client";

import { useProfile } from "@/components/dashboard/profile-provider";
import { usePreflightWarmup } from "@/components/dashboard/use-preflight-warmup";
import { InflectionForm } from "@/components/inflection";
import { PageLayout } from "@/components/page-header";
import { getLanguageByCode } from "@/lib/languages";

export default function InflectionsPage() {
  const profile = useProfile();
  const languageInfo = getLanguageByCode(profile.target_language);

  // Trigger Lambda warmup on page load
  usePreflightWarmup(profile.target_language);

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
