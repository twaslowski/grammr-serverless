import { createClient } from "@/lib/supabase/server";
import { getLanguageByCode } from "@/lib/languages";
import { LanguageCode } from "@/types/languages";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const targetLanguage = profile?.target_language
    ? getLanguageByCode(profile.target_language as LanguageCode)
    : null;

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">Welcome back!</h1>
        {targetLanguage && (
          <p className="text-muted-foreground">
            Continue learning {targetLanguage.flag} {targetLanguage.name}
          </p>
        )}
      </div>

      {/* Navigation Cards */}
      <section>
        <h2 className="font-semibold text-xl mb-4">Get Started</h2>
        <DashboardNav />
      </section>
    </div>
  );
}
