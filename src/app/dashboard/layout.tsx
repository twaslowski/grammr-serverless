import React from "react";
import { redirect } from "next/navigation";

import { ProfileProvider } from "@/components/dashboard/profile-provider";
import { createClient } from "@/lib/supabase/server";
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

  // Check if user has a profile with language preferences
  const { data: profileData, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If no profile exists, redirect to language selection
  // This happens when a user signs up but hasn't completed onboarding
  if (error?.code === "PGRST116" || !profileData) {
    redirect("/auth/sign-up/select-language");
  }

  // Handle other database errors
  if (error) {
    throw new Error(`Failed to fetch profile data: ${error.message}`);
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
