import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { LanguageSelector } from "@/components/auth/language-selector";
import { db } from "@/db/connect";
import { profiles } from "@/db/schemas/schema";
import { requireUser } from "@/lib/supabase/server";
import { ProfileSchema } from "@/types/profile";

export default async function LanguageSettingsPage() {
  const user = await requireUser();

  const [profileData] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const parsed = ProfileSchema.safeParse(profileData);
  const profile = parsed.success ? parsed.data : null;

  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <section className="flex justify-center py-6">
        <LanguageSelector profile={profile} mode="edit" />
      </section>
    </div>
  );
}
