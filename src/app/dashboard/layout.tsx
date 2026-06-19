import React from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { ProfileProvider } from "@/components/dashboard/profile-provider";
import { db } from "@/db/connect";
import { profiles } from "@/db/schemas";
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
  const userProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)
    .then((res) => ProfileSchema.parse(res[0]))
    .catch((err) => {
      console.error("Database error:", err);
      redirect("/auth/sign-up/select-language");
    });

  return (
    <ProfileProvider profile={userProfile}>
      <main>{children}</main>
    </ProfileProvider>
  );
}
