import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LanguageSelector } from "@/components/auth/language-selector";
import { createClient } from "@/lib/supabase/server";
import { ProfileSchema } from "@/types/profile";

export default async function LanguageSettingsPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Fetch the user's profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Parse the profile if it exists
  const parsed = ProfileSchema.safeParse(profileData);
  const profile = parsed.success ? parsed.data : null;

  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <section className="flex justify-center py-6">
        <LanguageSelector userId={user.id} profile={profile} mode="edit" />
      </section>
    </div>
  );
}
