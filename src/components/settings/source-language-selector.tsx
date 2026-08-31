"use client";

import { useState } from "react";
import { Loader2, SaveIcon } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { allLanguages, Language, LanguageCode } from "@/types/languages";
import { Profile } from "@/types/profile";

interface SourceLanguageSelectorProps {
  profile: Profile;
}

/**
 * Picks the language the reader already speaks.
 *
 * The target language is no longer a choice — this is a Russian-learning app —
 * so what used to be a two-step wizard is one screen, and it lives in settings
 * rather than in sign-up. The profile's existing `targetLanguage` is passed
 * straight back through on save so that changing your native language cannot
 * silently re-language your decks.
 */
export function SourceLanguageSelector({
  profile,
}: SourceLanguageSelectorProps) {
  const [selected, setSelected] = useState<LanguageCode>(
    profile.sourceLanguage,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await saveProfile(selected, profile.targetLanguage);
      toast.success("Updated language settings");
    } catch {
      setError("Failed to save language selection");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          What is your native language?
        </CardTitle>
        <CardDescription>
          Select the language you speak fluently. This is what translations and
          explanations are given in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {allLanguages.map((language) => (
            <LanguageCard
              key={language.code}
              language={language}
              isSelected={selected === language.code}
              onClick={() => setSelected(language.code)}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

interface LanguageCardProps {
  language: Language;
  isSelected: boolean;
  onClick: () => void;
}

function LanguageCard({ language, isSelected, onClick }: LanguageCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-colors hover:border-primary/50 hover:bg-accent",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
          : "border-muted",
      )}
    >
      <span className="text-4xl" role="img" aria-label={language.name}>
        {language.flag}
      </span>
      <div className="text-center">
        <p className="font-medium text-sm">{language.name}</p>
        <p className="text-xs text-muted-foreground">{language.nativeName}</p>
      </div>
    </button>
  );
}
