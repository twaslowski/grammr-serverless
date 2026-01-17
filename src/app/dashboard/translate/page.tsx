"use client";

import { TranslationForm } from "@/components/translation";
import { useProfile } from "@/components/dashboard/profile-provider";

export default function TranslationPage() {
  const profile = useProfile();

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-2xl">
        <h1 className="font-bold text-3xl mb-2">Translate</h1>
        <p className="text-muted-foreground">
          Enter text to translate and click on words to see their literal
          meanings.
        </p>
      </div>
      <TranslationForm profile={profile} />
    </div>
  );
}
