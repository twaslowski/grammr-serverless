"use client";

import React, { useState } from "react";
import { Eye, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { useProfile } from "@/components/dashboard/profile-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translate } from "@/lib/translation";

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
  const { source_language: spokenLanguage, target_language: learnedLanguage } =
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

  const handleReveal = () => {
    if (value && value.trim()) {
      // If translation exists, just reveal it
      setIsRevealed(true);
    } else {
      // If no translation, fetch it
      handleFetchTranslation();
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
  const hasTranslation = value && value.trim();
  const shouldShowContent = isRevealed && hasTranslation;

  return (
    <div
      className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={disabled ? undefined : handleReveal}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={hasTranslation ? "Reveal translation" : "Translate text"}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleReveal();
        }
      }}
    >
      <div className="min-h-[1.25rem] justify-between">
        {isTranslating ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Translating...</span>
          </div>
        ) : shouldShowContent ? (
          <span
            className={`transition-opacity duration-300 ease-in ${inputClassName}`}
            style={{ opacity: isRevealed ? 1 : 0 }}
          >
            {value}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {/* Redacted/spoiler blocks */}
              <div className="h-8 w-24 bg-muted-foreground rounded"></div>
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              Click to reveal
            </span>
            {!isTranslating && <Eye className="h-4 w-4" />}
          </div>
        )}
      </div>
      {!isTranslating && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          title="reveal translation"
          aria-label="reveal translation"
          tabIndex={-1} // Parent container handles keyboard interaction
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
