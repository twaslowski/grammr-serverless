"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { translate } from "@/lib/translation";
import toast from "react-hot-toast";
import { useProfile } from "@/components/dashboard/profile-provider";

interface TranslationInputProps {
  /** The current translation value */
  value: string;
  /** The text to translate from */
  textToTranslate: string;
  /** Callback when translation changes */
  onChange: (translation: string) => void;
  /** Whether the input should be read-only (preserves text styling) */
  readOnly?: boolean;
  /** Whether the entire component is disabled (input + button) */
  disabled?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Additional class name for the container */
  className?: string;
  /** Additional class name for the input element (for text styling) */
  inputClassName?: string;
  /** ID for the input element */
  id?: string;
}

export function TranslationInput({
  textToTranslate,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  placeholder = "Enter translation...",
  className = "",
  inputClassName = "",
  id,
}: TranslationInputProps) {
  const [isTranslating, setIsTranslating] = useState(false);
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch translation";
      toast.error(message);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={`flex gap-2 max-w-48 rounded-md border ${className}`}>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly || isTranslating}
        className={`flex-1 border-none ${inputClassName}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleFetchTranslation}
        disabled={disabled || isTranslating || !!value}
        title="Fetch translation"
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
