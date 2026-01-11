import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LanguageSelector } from "@/components/auth/language-selector";

export default async function SelectLanguagePage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Check if user already has language preferences set
  const { data: profile } = await supabase
    .from("profiles")
    .select("source_language, target_language")
    .eq("id", user.id)
    .single();

  // If languages are already set, redirect to protected area
  if (profile?.source_language && profile?.target_language) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <LanguageSelector userId={user.id} />
    </div>
  );
}
