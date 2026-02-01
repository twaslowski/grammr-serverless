"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TranslationResult } from "./translation-result";
import { translate } from "@/lib/translation";
import { Profile } from "@/types/profile";
import { getLanguageByCode } from "@/lib/languages";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { MorphologicalAnalysis } from "@/types/morphology";
import { analyzeMorphology } from "@/lib/morphology";
import { InflectablePosSet, Paradigm } from "@/types/inflections";
import { getInflections } from "@/lib/inflections";

interface TranslationFormProps {
  profile: Profile;
}

export function TranslationForm({ profile }: TranslationFormProps) {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [morphologicalAnalysis, setMorphologicalAnalysis] =
    useState<MorphologicalAnalysis | null>(null);
  const [paradigms, setParadigms] = useState<Paradigm[]>([]);

  // isReversed = false: Analysis Mode (learned language → spoken language)
  // isReversed = true: Translation Mode (spoken language → learned language)
  const [isReversed, setIsReversed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAnalysisMode = !isReversed;

  // Determine source and target languages based on direction
  const sourceLanguage = isReversed
    ? profile.source_language
    : profile.target_language;
  const targetLanguage = isReversed
    ? profile.target_language
    : profile.source_language;

  const sourceLanguageInfo = getLanguageByCode(sourceLanguage);
  const targetLanguageInfo = getLanguageByCode(targetLanguage);

  const handleTranslate = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setTranslatedText(null);

    try {
      const result = await translate({
        text: text.trim(),
        source_language: sourceLanguage,
        target_language: targetLanguage,
      });

      const morphologyResult = await analyzeMorphology(
        isAnalysisMode
          ? { phrase: text.trim(), language: sourceLanguage }
          : { phrase: result.translation, language: targetLanguage },
      );

      const paradigms = await fetchParadigms(morphologyResult);

      setParadigms(paradigms);
      setMorphologicalAnalysis(morphologyResult);
      setTranslatedText(result.translation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParadigms = async (
    morphologicalAnalysis: MorphologicalAnalysis,
  ): Promise<Paradigm[]> => {
    return await Promise.all(
      morphologicalAnalysis.tokens
        .filter((token) => InflectablePosSet.has(token.pos))
        .map((token) =>
          getInflections({
            lemma: token.lemma,
            pos: token.pos,
            language: isAnalysisMode ? sourceLanguage : targetLanguage,
          }),
        ),
    );
  };

  const handleSwapLanguages = () => {
    setIsReversed(!isReversed);
    // Clear previous translation when swapping
    setTranslatedText(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleTranslate();
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {isAnalysisMode ? "Analysis Mode" : "Translation Mode"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {isAnalysisMode
                  ? "Practice reading in your learned language"
                  : "Translate to your learned language"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                {sourceLanguageInfo?.flag} {sourceLanguageInfo?.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwapLanguages}
                className="h-8 w-8"
                title="Swap languages"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {targetLanguageInfo?.flag} {targetLanguageInfo?.name}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder={`Enter text in ${sourceLanguageInfo?.name || "source language"}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to translate
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleTranslate}
            disabled={!text.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Translating...
              </>
            ) : (
              "Translate"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Translation Result */}
      {isLoading && !translatedText && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">
                Translating your text...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {translatedText && morphologicalAnalysis && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <TranslationResult
              originalText={text.trim()}
              translatedText={translatedText}
              sourceLanguage={sourceLanguage}
              paradigms={paradigms}
              morphologicalAnalysis={morphologicalAnalysis}
              targetLanguage={targetLanguage}
              isAnalysisMode={isAnalysisMode}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
