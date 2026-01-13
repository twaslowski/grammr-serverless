import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Profile, ProfileSchema } from "@/types/profile";

export async function getProfile(): Promise<Profile> {
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

  const { data, error } = ProfileSchema.safeParse(profile);

  if (error) {
    throw new Error("Profile data is invalid");
  }

  return data;
}
