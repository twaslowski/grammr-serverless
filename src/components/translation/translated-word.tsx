"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { translateWord } from "@/lib/translation";
import { analyzeMorphology } from "@/lib/morphology";
import { TokenMorphology } from "@/types/morphology";
import { Loader2 } from "lucide-react";
import { Morphology } from "@/components/translation/morphology";
import { LanguageCode } from "@/types/languages";
import { WordDetailsDialog } from "@/components/translation/word-details-dialog";
import { useProfile } from "@/components/dashboard/profile-provider";

interface TranslatedWordProps {
  word: string;
  phrase: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
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
  const [morphology, setMorphology] = useState<TokenMorphology | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the clean word without punctuation for translation
  const cleanWord = stripPunctuation(word);

  // sourceLanguage and targetLanguage are not stable in this context; this is always consistent
  const userLearnedLanguage = useProfile().target_language;

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    if (open && !translation && !isLoading && cleanWord) {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch translation and morphology in parallel
        const [translationResult, morphologyResult] = await Promise.all([
          translateWord({
            phrase,
            word: cleanWord,
            source_language: sourceLanguage,
            target_language: targetLanguage,
          }),
          analyzeMorphology({ phrase, language: userLearnedLanguage }),
        ]);

        setTranslation(translationResult.translation);

        // Find the token that matches the current word
        const matchingToken = morphologyResult.tokens.find(
          (token) => token.text.toLowerCase() === cleanWord.toLowerCase(),
        );
        if (matchingToken) {
          setMorphology(matchingToken);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load word details",
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
        <div className="flex flex-row items-center justify-between text-center border-b bg-muted/50 px-2 py-2">
          <h3 className="font-semibold text-sm">Word Details</h3>
          <div className="flex gap-x-2">
            <WordDetailsDialog
              word={cleanWord}
              translation={translation}
              morphology={morphology}
              isLoading={isLoading}
            />
          </div>
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
            translation &&
            morphology && (
              <Morphology
                word={cleanWord}
                translation={translation}
                morphology={morphology}
              />
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
