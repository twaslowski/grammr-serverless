"use client";

import React from "react";
import { Layers, Plus } from "lucide-react";

import { CreateFlashcardDialog } from "@/components/flashcard";
import { Analysis } from "@/components/flashcard/analysis";
import { TTSButton } from "@/components/tts/tts-button";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { LanguageCode } from "@/types/languages";
import { EnrichedMorphologicalAnalysis } from "@/types/morphology";

interface TranslationResultProps {
  originalText: string;
  translatedText: string;
  morphologicalAnalysis: EnrichedMorphologicalAnalysis;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  isAnalysisMode?: boolean;
}

export function TranslationResult({
  originalText,
  translatedText,
  morphologicalAnalysis,
  isAnalysisMode = false,
}: TranslationResultProps) {
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
            <div className="flex gap-x-1">
              <CreateFlashcardDialog
                front={translatedText}
                back={{
                  ...morphologicalAnalysis,
                  type: "analysis",
                  translation: translatedText,
                }}
                trigger={
                  <Button variant="outline" size="sm" className="h-9 w-16">
                    <Layers className="h-4 w-4" />
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
              <TTSButton variant="outline" text={translatedText} />
              <CopyButton variant="outline" text={translatedText} />
            </div>
          </div>
          <Analysis analysis={morphologicalAnalysis} />
        </div>

        {/* Translation in spoken language - smaller, secondary */}
        <div className="p-3 rounded-lg border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Translation:</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {translatedText}
          </p>
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
          <div className="flex gap-x-1">
            <CreateFlashcardDialog
              front={translatedText}
              back={{
                ...morphologicalAnalysis,
                type: "analysis",
                translation: originalText,
              }}
              trigger={
                <Button variant="outline" size="sm" className="h-9 w-16">
                  <Layers className="h-4 w-4" />
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
            <TTSButton variant="outline" text={translatedText} />
            <CopyButton variant="outline" text={translatedText} />
          </div>
        </div>

        <div className="flex flex-row gap-x-1 text-lg leading-relaxed">
          <Analysis analysis={morphologicalAnalysis} textStyle="text-2xl" />
        </div>
      </div>
    </div>
  );
}
