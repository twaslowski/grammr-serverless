"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getInflections, InflectionError } from "@/lib/inflections";
import { Paradigm, PartOfSpeech } from "@/types/inflections";
import { InflectionsTable } from "./inflections-table";
import { getLanguageByCode } from "@/lib/languages";
import { LanguageCode } from "@/types/languages";

const POS_OPTIONS: { value: PartOfSpeech; label: string }[] = [
  { value: "NOUN", label: "Noun" },
  { value: "ADJ", label: "Adjective" },
  { value: "VERB", label: "Verb" },
  { value: "AUX", label: "Auxiliary" },
];

interface InflectionFormProps {
  learnedLanguage: LanguageCode;
  sourceLanguage: LanguageCode;
}

export function InflectionForm({ learnedLanguage }: InflectionFormProps) {
  const [word, setWord] = useState("");
  const [pos, setPos] = useState<PartOfSpeech>("NOUN");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    isUserError: boolean;
  } | null>(null);
  const [result, setResult] = useState<Paradigm | null>(null);

  // Get the user's learned language (target_language)
  const languageInfo = getLanguageByCode(learnedLanguage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await getInflections({
        lemma: word.trim(),
        pos,
        language: learnedLanguage,
      });
      setResult(response);
    } catch (err) {
      if (err instanceof InflectionError) {
        setError({ message: err.message, isUserError: err.isUserError });
      } else {
        setError({
          message: "An unexpected error occurred",
          isUserError: false,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inflect Word</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="word">Word (base form)</Label>
              <Input
                id="word"
                type="text"
                placeholder={`Enter a ${languageInfo?.name || "word"} word...`}
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pos">Part of Speech</Label>
              <div className="flex flex-wrap gap-2">
                {POS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={pos === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPos(option.value)}
                    disabled={isLoading}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !word.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inflecting...
                </>
              ) : (
                "Inflect"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card
          className={error.isUserError ? "border-yellow-500" : "border-red-500"}
        >
          <CardContent className="pt-6">
            <div
              className={`text-sm ${error.isUserError ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}
            >
              <strong>
                {error.isUserError ? "Input Error" : "System Error"}:
              </strong>{" "}
              {error.message}
            </div>
          </CardContent>
        </Card>
      )}

      {result && <InflectionsTable paradigm={result} />}
    </div>
  );
}
