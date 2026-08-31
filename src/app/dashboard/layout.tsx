import React from "react";

import { ProfileProvider } from "@/components/dashboard/profile-provider";
import { BottomTabBar, TopTabs } from "@/components/navigation/tab-bar";
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

  return (
    <ProfileProvider profile={profile}>
      <TopTabs />
      {/*
        The bottom padding clears the fixed tab bar and, on a notched phone, the
        home indicator below it. Without it the last card in any list sits under
        the bar and cannot be tapped.
      */}
      <div className="flex flex-1 flex-col p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
        {children}
      </div>
      <BottomTabBar />
    </ProfileProvider>
  );
}
