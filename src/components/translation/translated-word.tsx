"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { translateWord } from "@/lib/translation";
import { Loader2 } from "lucide-react";

interface TranslatedWordProps {
  word: string;
  phrase: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Strips punctuation from the beginning and end of a word.
 * Preserves the core word for translation purposes.
 */
function stripPunctuation(word: string): string {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

export function TranslatedWord({
  word,
  phrase,
  sourceLanguage,
  targetLanguage,
}: TranslatedWordProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the clean word without punctuation for translation
  const cleanWord = stripPunctuation(word);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    if (open && !translation && !isLoading && cleanWord) {
      setIsLoading(true);
      setError(null);

      try {
        const result = await translateWord({
          phrase,
          word: cleanWord,
          source_language: sourceLanguage,
          target_language: targetLanguage,
        });
        setTranslation(result.translation);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to translate word",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Don't make punctuation-only segments interactive
  if (!cleanWord) {
    return <span>{word}</span>;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer hover:bg-primary/10 hover:text-primary px-0.5 rounded transition-colors">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 shadow-lg" align="start">
        <div className="border-b bg-muted/50 px-4 py-3">
          <h4 className="font-semibold text-sm">Word Details</h4>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Translating...
              </span>
            </div>
          ) : error ? (
            <div className="text-sm text-destructive py-2">{error}</div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Word
                </p>
                <p className="font-medium">{cleanWord}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Translation
                </p>
                <p className="font-medium text-primary">{translation}</p>
              </div>
              {/* Additional fields can be added here in the future */}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
