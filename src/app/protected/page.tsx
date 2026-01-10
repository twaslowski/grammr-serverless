import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { getLanguageByCode } from "@/lib/languages";
import { LanguageCode } from "@/types/languages";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const targetLanguage = profile?.target_language
    ? getLanguageByCode(profile.target_language as LanguageCode)
    : null;

  return (
    <div className="flex-1 w-full flex flex-col gap-12 max-w-4xl">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>

      {targetLanguage && (
        <div className="flex flex-col gap-2 items-start">
          <h2 className="font-bold text-2xl mb-4">
            Learning {targetLanguage.flag} {targetLanguage.name}
          </h2>
          <p className="text-muted-foreground">
            You&apos;re set up to learn {targetLanguage.name}. Start analyzing
            sentences or building flashcard decks to get going.
          </p>
        </div>
      )}

      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <p className="text-muted-foreground">
          More features coming soon: text analysis, flashcard decks, and Anki
          export.
        </p>
      </div>
    </div>
  );
}
