import { PageLayout } from "@/components/page-header";
import { SourceLanguageSelector } from "@/components/settings/source-language-selector";
import { ensureProfile } from "@/lib/server/ensure-profile";
import { requireUser } from "@/lib/supabase/server";

export default async function LanguageSettingsPage() {
  const user = await requireUser();
  const profile = await ensureProfile(user.id);

  return (
    <PageLayout
      header={{
        title: "Language",
        description: "The language translations and explanations are given in.",
        backHref: "/dashboard/settings",
        backLabel: "Back to Settings",
      }}
    >
      <section className="flex justify-center py-2">
        <SourceLanguageSelector profile={profile} />
      </section>
    </PageLayout>
  );
}
