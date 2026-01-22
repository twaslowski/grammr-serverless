"use client";

import { InflectionForm } from "@/components/inflection";
import { useProfile } from "@/components/dashboard/profile-provider";
import { usePreflightWarmup } from "@/components/dashboard/use-preflight-warmup";
import { PageLayout } from "@/components/page-header";

export default function InflectionsPage() {
  const profile = useProfile();

  // Trigger Lambda warmup on page load
  usePreflightWarmup();

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
        <InflectionForm
          learnedLanguage={profile.target_language}
          sourceLanguage={profile.source_language}
        />
      </div>
    </PageLayout>
  );
}
