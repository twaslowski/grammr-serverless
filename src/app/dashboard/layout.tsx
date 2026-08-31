import React from "react";

import { ProfileProvider } from "@/components/dashboard/profile-provider";
import { ensureProfile } from "@/lib/server/ensure-profile";
import { requireUser } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Provisioned on first sight rather than asked for: there is no language
  // wizard any more. A genuine database failure throws, as it should — the
  // previous version caught it and redirected, which presented an outage as a
  // missing profile.
  const profile = await ensureProfile(user.id);

  return <ProfileProvider profile={profile}>{children}</ProfileProvider>;
}
