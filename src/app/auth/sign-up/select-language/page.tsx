import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { LanguageSelector } from "@/components/auth/language-selector";
import { db } from "@/db/connect";
import { profiles } from "@/db/schemas/schema";
import { requireUser } from "@/lib/supabase/server";

export default async function SelectLanguagePage() {
  const user = await requireUser();

  // Check if user already has language preferences set
  const [profile] = await db
    .select({
      sourceLanguage: profiles.sourceLanguage,
      targetLanguage: profiles.targetLanguage,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // If languages are already set, redirect to protected area
  if (profile?.sourceLanguage && profile?.targetLanguage) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <LanguageSelector />
    </div>
  );
}
