import { createClient } from "@/lib/supabase/server";
import { TranslationForm } from "@/components/translation";
import { Profile } from "@/types/types";
import { redirect } from "next/navigation";

export default async function TranslationPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Failed to fetch profile");
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-2xl">
        <h1 className="font-bold text-3xl mb-2">Translate</h1>
        <p className="text-muted-foreground">
          Enter text to translate and click on words to see their literal
          meanings.
        </p>
      </div>
      <TranslationForm profile={profile as Profile} />
    </div>
  );
}
