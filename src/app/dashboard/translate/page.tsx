"use client";

import { TranslationForm } from "@/components/translation";
import { useProfile } from "@/components/dashboard/profile-provider";
import { usePreflightWarmup } from "@/components/dashboard/use-preflight-warmup";
import { PageLayout } from "@/components/page-header";

export default function TranslationPage() {
  const profile = useProfile();

  // Trigger Lambda warmup on page load
  usePreflightWarmup();

  return (
    <PageLayout
      header={{
        title: "Translate",
        description:
          "Enter text to translate and click on words to see their literal meanings.",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <TranslationForm profile={profile} />
    </PageLayout>
  );
}
