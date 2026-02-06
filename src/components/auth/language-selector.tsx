"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  allLanguages,
  Language,
  LanguageCode,
  targetLanguages,
} from "@/types/languages";
import { Profile } from "@/types/profile";

interface LanguageSelectorProps {
  profile?: Profile | null;
  mode?: "signup" | "edit";
}

type Step = "source" | "target";

export function LanguageSelector({ profile, mode }: LanguageSelectorProps) {
  const [step, setStep] = useState<Step>("source");
  const [selectedSourceLanguage, setSelectedSourceLanguage] = useState<
    LanguageCode | undefined
  >(profile?.source_language);
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<
    LanguageCode | undefined
  >(profile?.target_language);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleContinueToTarget = () => {
    if (!selectedSourceLanguage) return;
    setStep("target");
  };

  const handleBackToSource = () => {
    setStep("source");
  };

  const handleSave = async () => {
    if (!selectedSourceLanguage || !selectedTargetLanguage) return;

    setIsLoading(true);
    setError(null);

    try {
      await saveProfile(selectedSourceLanguage, selectedTargetLanguage);
      toast.success("Updated language settings");
      router.push("/dashboard");
    } catch {
      setError("Failed to save language selection");
    } finally {
      setIsLoading(false);
    }
  };

  const saveButtonContents =
    mode === "edit" ? (
      <>
        <SaveIcon className="h-4 w-4" />
        <p>Save</p>
      </>
    ) : (
      <>
        <p>Continue</p>
        <ArrowRight className="h-4 w-4" />
      </>
    );

  // Filter out the selected source language from target options
  const availableTargetLanguages = targetLanguages.filter(
    (lang) => lang.code !== selectedSourceLanguage,
  );

  if (step === "source") {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            What is your native language?
          </CardTitle>
          <CardDescription>
            Select the language you speak fluently. This will be used for
            translations and explanations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {allLanguages.map((language) => (
              <LanguageCard
                key={language.code}
                language={language}
                isSelected={selectedSourceLanguage === language.code}
                onClick={() => setSelectedSourceLanguage(language.code)}
              />
            ))}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            onClick={handleContinueToTarget}
            disabled={!selectedSourceLanguage}
            className="w-full"
            size="lg"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Step 1 of 2
          </p>
        </CardContent>
      </Card>
    );
  }

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
          {availableTargetLanguages.map((language) => (
            <LanguageCard
              key={language.code}
              language={language}
              isSelected={selectedTargetLanguage === language.code}
              onClick={() => setSelectedTargetLanguage(language.code)}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div className="flex gap-3">
          <Button
            onClick={handleBackToSource}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedTargetLanguage || isLoading}
            className="flex-1"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              saveButtonContents
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">Step 2 of 2</p>
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
