"use client";

import { TranslatedWord } from "./translated-word";

interface TranslationResultProps {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export function TranslationResult({
  translatedText,
  sourceLanguage,
  targetLanguage,
}: TranslationResultProps) {
  // Split the translated text into words while preserving spaces and punctuation
  const words = translatedText.split(/(\s+)/);

  return (
    <div className="p-4 rounded-lg border bg-muted/50">
      <p className="text-sm text-muted-foreground mb-2">Translation:</p>
      <p className="text-lg leading-relaxed">
        {words.map((segment, index) => {
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
  );
}
