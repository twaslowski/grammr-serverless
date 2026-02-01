"use client";

import { CreateFlashcardDialog } from "@/components/flashcard";
import { TTSButton } from "@/components/tts/tts-button";
import { LanguageCode } from "@/types/languages";
import { MorphologicalAnalysis } from "@/types/morphology";
import { find, stripPunctuation } from "@/lib/morphology";
import { Paradigm } from "@/types/inflections";
import { WordDetailsDialog } from "@/components/translation/word-details-dialog";

interface TranslationResultProps {
  originalText: string;
  translatedText: string;
  morphologicalAnalysis: MorphologicalAnalysis;
  paradigms: Paradigm[];
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  isAnalysisMode?: boolean;
}

export function TranslationResult({
  originalText,
  translatedText,
  morphologicalAnalysis,
  paradigms,
  sourceLanguage,
  targetLanguage,
  isAnalysisMode = false,
}: TranslationResultProps) {
  // Split the translated text into words while preserving spaces and punctuation
  const translatedWords = translatedText.split(/(\s+)/);

  // In analysis mode, we show clickable words from original text (learned language)
  const originalWords = originalText.split(/(\s+)/);

  if (isAnalysisMode && originalText) {
    // Analysis Mode: Show original text (learned language) as clickable,
    // and the translation (spoken language) as secondary
    return (
      <div className="space-y-4">
        {/* Original text in learned language - main focus with clickable words */}
        <div className="p-4 rounded-lg border bg-background">
          <div className="flex flex-row justify-between">
            <p className="text-sm text-muted-foreground mb-2">
              Original (click words to analyze):
            </p>
            <div className="flex gap-x-2">
              <CreateFlashcardDialog
                compact={true}
                front={originalText}
                translation={translatedText}
                type="phrase"
              />
              <TTSButton text={originalText} />
            </div>
          </div>
          <p className="text-lg leading-relaxed">
            {originalWords.map((segment, index) => {
              // If the segment is whitespace, just render it
              if (/^\s+$/.test(segment)) {
                return <span key={index}>{segment}</span>;
              }

              const matchingToken = find(segment, morphologicalAnalysis);
              const paradigm =
                paradigms &&
                paradigms.find((p) => p.lemma === matchingToken?.lemma);

              // If it's a word (possibly with punctuation), make it interactive
              if (segment.trim() && matchingToken) {
                return (
                  <WordDetailsDialog
                    key={index}
                    word={segment}
                    morphology={matchingToken}
                    sourceLanguage={sourceLanguage}
                    targetLanguage={targetLanguage}
                    paradigm={paradigm}
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
        <div className="flex flex-row justify-between">
          <p className="text-sm text-muted-foreground mb-2">Translation:</p>
          <div className="flex gap-x-2">
            <CreateFlashcardDialog
              compact={true}
              front={translatedText}
              translation={originalText}
            />
            <TTSButton text={translatedText} />
          </div>
        </div>

        <div className="flex flex-row gap-x-1 text-lg leading-relaxed">
          {translatedWords.map((segment, index) => {
            // If the segment is whitespace, just render it
            if (/^\s+$/.test(segment)) {
              return <span key={index}>{segment}</span>;
            }

            const matchingToken = find(
              stripPunctuation(segment),
              morphologicalAnalysis,
            );
            const paradigm =
              paradigms &&
              paradigms.find((p) => p.lemma === matchingToken?.lemma);
            console.log(index, segment, matchingToken);

            // If it's a word (possibly with punctuation), make it interactive
            if (segment.trim() && matchingToken) {
              return (
                <WordDetailsDialog
                  key={index}
                  word={segment}
                  morphology={matchingToken}
                  sourceLanguage={sourceLanguage}
                  targetLanguage={targetLanguage}
                  paradigm={paradigm}
                />
              );
            } else {
              return <span key={index}>{segment}</span>;
            }
          })}
        </div>
      </div>
    </div>
  );
}
