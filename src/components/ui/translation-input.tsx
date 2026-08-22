"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { useProfile } from "@/components/dashboard/profile-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translate } from "@/lib/translation";
import { cn } from "@/lib/utils";

interface TranslationInputProps {
  /** The current translation value */
  value: string;
  /** The text to translate from */
  textToTranslate: string;
  /** Callback when translation changes */
  onChange: (translation: string) => void;
  /** Whether the input should be read-only (preserves text styling) */
  disabled?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Additional class name for the container */
  className?: string;
  /** Additional class name for the input element (for text styling) */
  inputClassName?: string;
  /** ID for the input element */
  editable?: boolean;
}

export function TranslationInput({
  textToTranslate,
  value,
  onChange,
  disabled = false,
  placeholder = "Enter translation...",
  className = "",
  inputClassName = "",
  editable = true,
}: TranslationInputProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const { sourceLanguage: spokenLanguage, targetLanguage: learnedLanguage } =
    useProfile();

  const handleFetchTranslation = async () => {
    if (
      !textToTranslate ||
      !textToTranslate.trim() ||
      !spokenLanguage ||
      !learnedLanguage
    ) {
      return;
    }

    setIsTranslating(true);

    try {
      const result = await translate({
        text: textToTranslate,
        source_language: learnedLanguage,
        target_language: spokenLanguage,
      });
      onChange(result.translation);
      if (!editable) {
        setIsRevealed(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch translation";
      toast.error(message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggleReveal = () => {
    if (isRevealed) {
      setIsRevealed(false);
    } else if (value && value.trim()) {
      // If translation exists, just reveal it
      setIsRevealed(true);
    } else {
      // If no translation, fetch it
      void handleFetchTranslation();
    }
  };

  // If editable, render the input version
  if (editable) {
    return (
      <div className={`flex gap-2 rounded-md border ${className}`}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={isTranslating}
          className={`flex-1 border-none ${inputClassName}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleFetchTranslation}
          disabled={disabled || isTranslating || !!value}
          title="Fetch translation"
          aria-label={isTranslating ? "Translating" : "Fetch translation"}
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // If not editable, render the spoiler/reveal version
  const hasTranslation = !!(value && value.trim());
  const isRevealedNow = isRevealed && hasTranslation;
  const label = isRevealedNow
    ? "Hide translation"
    : hasTranslation
      ? "Reveal translation"
      : "Translate text";

  return (
    <div
      className={cn(
        "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-4 py-2 transition-colors",
        isRevealedNow ? "bg-muted/40" : "border-dashed bg-muted/20",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-muted/60",
        className,
      )}
      onClick={disabled ? undefined : handleToggleReveal}
      role="button"
      tabIndex={disabled ? -1 : 0}
      title={label}
      aria-label={label}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleToggleReveal();
        }
      }}
    >
      {isTranslating ? (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Translating...
        </span>
      ) : hasTranslation ? (
        <span
          className={cn(
            "text-lg leading-snug transition-[filter,opacity] duration-300 ease-out",
            isRevealedNow ? "opacity-100" : "select-none opacity-60 blur-[6px]",
            inputClassName,
          )}
        >
          {value}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="h-4 w-28 rounded-full bg-foreground/15"
        />
      )}

      {!isTranslating && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          {isRevealedNow ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : hasTranslation ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isRevealedNow ? "Hide" : hasTranslation ? "Reveal" : "Translate"}
        </span>
      )}
    </div>
  );
}
