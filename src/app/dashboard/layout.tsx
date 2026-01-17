import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import React from "react";
import { ProfileProvider } from "@/components/dashboard/profile-provider";
import { ProfileSchema } from "@/types/profile";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Check if user has language preferences set
  const { data: profileData, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile data: ${error.message}`);
  }

  // If languages are not set, redirect to language selection
  if (!profileData?.source_language || !profileData?.target_language) {
    redirect("/auth/sign-up/select-language");
  }

  // Parse and validate the profile data
  const { data: profile, error: parseError } =
    ProfileSchema.safeParse(profileData);

  if (parseError || !profile) {
    throw new Error("Profile data is invalid");
  }

  return (
    <ProfileProvider profile={profile}>
      <main className="min-h-screen flex flex-col items-center p-6">
        {children}
      </main>
    </ProfileProvider>
  );
}
