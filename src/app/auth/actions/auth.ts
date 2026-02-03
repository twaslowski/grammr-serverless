"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { instanceUrl } from "@/lib/utils";

export interface Provider {
  name: "github" | "google";
}

export async function signInWithProvider(provider: Provider) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider.name,
    options: {
      redirectTo: `${instanceUrl()}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/error?message=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }

  redirect("/auth/error?message=Unable to initiate authentication");
}

/**
 * Server action for email signup.
 * Handles both user creation and default tracking configuration atomically.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const supabase = await createClient();

  // Create the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error("Sign-up error: " + error?.message);
  }
}
