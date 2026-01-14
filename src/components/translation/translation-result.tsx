"use client";

import { TranslatedWord } from "./translated-word";
import { CreateFlashcardDialog } from "@/components/flashcard";

interface TranslationResultProps {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  isAnalysisMode?: boolean;
  originalText?: string;
}

export function TranslationResult({
  translatedText,
  sourceLanguage,
  targetLanguage,
  isAnalysisMode = false,
  originalText,
}: TranslationResultProps) {
  // Split the translated text into words while preserving spaces and punctuation
  const translatedWords = translatedText.split(/(\s+)/);

  // In analysis mode, we show clickable words from original text (learned language)
  const originalWords = originalText ? originalText.split(/(\s+)/) : [];

  if (isAnalysisMode && originalText) {
    // Analysis Mode: Show original text (learned language) as clickable,
    // and the translation (spoken language) as secondary
    return (
      <div className="space-y-4">
        {/* Original text in learned language - main focus with clickable words */}
        <div className="p-4 rounded-lg border bg-background">
          <p className="text-sm text-muted-foreground mb-2">
            Original (click words to analyze):
          </p>
          <p className="text-lg leading-relaxed">
            {originalWords.map((segment, index) => {
              // If the segment is whitespace, just render it
              if (/^\s+$/.test(segment)) {
                return <span key={index}>{segment}</span>;
              }

              // If it's a word (possibly with punctuation), make it interactive
              if (segment.trim()) {
                return (
                  <TranslatedWord
                    key={index}
                    word={segment}
                    phrase={originalText}
                    sourceLanguage={sourceLanguage}
                    targetLanguage={targetLanguage}
                  />
                );
              }

              return null;
            })}
          </p>
        </div>

        {/* Translation in spoken language - smaller, secondary */}
        <div className="p-3 rounded-lg border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Translation:</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {translatedText}
          </p>
        </div>

        {/* Add phrase to flashcards */}
        <div className="flex justify-end">
          <CreateFlashcardDialog
            front={originalText}
            type="phrase"
            translation={translatedText}
          />
        </div>
      </div>
    );
  }

  // Translation Mode: Show translated text with clickable words (existing behavior)
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border bg-muted/50">
        <p className="text-sm text-muted-foreground mb-2">Translation:</p>
        <p className="text-lg leading-relaxed">
          {translatedWords.map((segment, index) => {
            // If the segment is whitespace, just render it
            if (/^\s+$/.test(segment)) {
              return <span key={index}>{segment}</span>;
            }

            // If it's a word (possibly with punctuation), make it interactive
            if (segment.trim()) {
              return (
                <TranslatedWord
                  key={index}
                  word={segment}
                  phrase={translatedText}
                  sourceLanguage={targetLanguage}
                  targetLanguage={sourceLanguage}
                />
              );
            }

            return null;
          })}
        </p>
      </div>

      {/* Add translated phrase to flashcards */}
      <div className="flex justify-end">
        <CreateFlashcardDialog
          front={translatedText}
          type="phrase"
          translation={originalText || ""}
        />
      </div>
    </div>
  );
}
