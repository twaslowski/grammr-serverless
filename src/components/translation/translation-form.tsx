"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TranslationResult } from "./translation-result";
import { translatePhrase } from "@/lib/translation";
import { Profile } from "@/types/profile";
import { getLanguageByCode } from "@/lib/languages";
import { LanguageCode } from "@/types/languages";
import { ArrowRightLeft, Loader2 } from "lucide-react";

interface TranslationFormProps {
  profile: Profile;
}

export function TranslationForm({ profile }: TranslationFormProps) {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine mode based on direction
  // isReversed = false: Analysis Mode (learned language → spoken language)
  // isReversed = true: Translation Mode (spoken language → learned language)
  const isAnalysisMode = !isReversed;

  // Determine source and target languages based on direction
  const sourceLanguage = isReversed
    ? profile.source_language
    : profile.target_language;
  const targetLanguage = isReversed
    ? profile.target_language
    : profile.source_language;

  const sourceLanguageInfo = getLanguageByCode(sourceLanguage as LanguageCode);
  const targetLanguageInfo = getLanguageByCode(targetLanguage as LanguageCode);

  const handleTranslate = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setTranslatedText(null);

    try {
      const result = await translatePhrase({
        text: text.trim(),
        source_language: sourceLanguage,
        target_language: targetLanguage,
      });
      setTranslatedText(result.translation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setIsLoading(false);
    }
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
      handleTranslate();
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
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

      {translatedText && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <TranslationResult
              translatedText={translatedText}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              isAnalysisMode={isAnalysisMode}
              originalText={isAnalysisMode ? text.trim() : undefined}
            />
            <p className="text-xs text-muted-foreground mt-3">
              {isAnalysisMode
                ? "Click on any word above to see its translation and analysis"
                : "Click on any word to see its literal translation"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
