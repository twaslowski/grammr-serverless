"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { targetLanguages, Language, LanguageCode } from "@/types/languages";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";

interface LanguageSelectorProps {
  userId: string;
}

export function LanguageSelector({ userId }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedLanguage) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          source_language: "en", // English is the only source language for now
          target_language: selectedLanguage,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      router.push("/protected");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save language selection",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          Which language are you learning?
        </CardTitle>
        <CardDescription>
          Select the language you want to study. You can change this later in
          your settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {targetLanguages.map((language) => (
            <LanguageCard
              key={language.code}
              language={language}
              isSelected={selectedLanguage === language.code}
              onClick={() => setSelectedLanguage(language.code)}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button
          onClick={handleContinue}
          disabled={!selectedLanguage || isLoading}
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
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Currently, grammr assumes English as your native language. More source
          languages will be available soon.
        </p>
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
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50 hover:bg-accent",
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
