import { createClient } from "@/lib/supabase/server";
import { InflectionForm } from "@/components/inflection";
import { Profile } from "@/types/types";
import { redirect } from "next/navigation";

export default async function InflectionsPage() {
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
        <h1 className="font-bold text-3xl mb-2">Inflect</h1>
        <p className="text-muted-foreground">
          Enter a word to see all its inflected forms. Select the part of speech
          to get accurate inflections.
        </p>
      </div>
      <InflectionForm profile={profile as Profile} />
    </div>
  );
}
