"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { TranslitToggle } from "@/components/translit/translit-toggle";
import { useTranslit } from "@/components/translit/use-translit";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lookup } from "@/lib/dictionary";
import { DictionaryResponse } from "@/types/dictionary";
import { LanguageCode } from "@/types/languages";

import { DictionaryResults } from "./dictionary-results";

interface DictionarySearchProps {
  languageCode: LanguageCode;
  languageName: string;
}

const DEBOUNCE_MS = 350;

/**
 * The dictionary's single input.
 *
 * Two things are absent by design. There is no part-of-speech selector: asking
 * the reader to classify a word before looking it up is the thing this replaces,
 * and homographs are offered as a choice in the results instead. And there is no
 * submit button — the lookup is debounced, so the reader types and reads rather
 * than typing, committing, and being told they got it wrong.
 */
export function DictionarySearch({
  languageCode,
  languageName,
}: DictionarySearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DictionaryResponse | null>(null);
  const translit = useTranslit();

  // Guards against a slow earlier lookup resolving after a faster later one and
  // painting stale results over them.
  const requestId = useRef(0);

  const search = useCallback(
    async (term: string) => {
      const id = ++requestId.current;
      setIsLoading(true);
      setError(null);

      try {
        const response = await lookup({ query: term, language: languageCode });
        if (id === requestId.current) {
          setResult(response);
        }
      } catch (e) {
        if (id === requestId.current) {
          setError(e instanceof Error ? e.message : "Lookup failed");
          setResult(null);
        }
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
        }
      }
    },
    [languageCode],
  );

  /**
   * Clearing happens here rather than in the effect below.
   *
   * Emptying the field is a user event with an immediate, known outcome -- show
   * nothing -- so it belongs in the handler. Doing it in the effect would mean
   * setting state synchronously during render, which cascades.
   */
  const handleChange = (raw: string) => {
    // Converted here rather than in render: rewriting the value during render
    // would fight the caret, and only the newly typed tail should change.
    const value = translit.convert(query, raw);
    setQuery(value);

    if (!value.trim()) {
      // Also abandons any in-flight lookup, as far as the UI is concerned.
      requestId.current++;
      setResult(null);
      setError(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      return;
    }

    const timer = setTimeout(() => void search(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              // Not "Word (base form)": an inflected form resolves to its lemma,
              // and saying so is how the reader finds out.
              placeholder={`Look up any ${languageName} word...`}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              autoComplete="off"
              autoFocus
              aria-label={`Search the ${languageName} dictionary`}
              className="h-11 pl-9 pr-24"
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
              {isLoading && (
                <Loader2
                  className="mr-1 h-4 w-4 animate-spin text-muted-foreground"
                  aria-label="Searching"
                />
              )}
              <TranslitToggle
                enabled={translit.enabled}
                onToggle={translit.toggle}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Something went wrong:</strong> {error}
            </p>
          </CardContent>
        </Card>
      )}

      {!error && result && (
        <DictionaryResults
          result={result}
          languageCode={languageCode}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
