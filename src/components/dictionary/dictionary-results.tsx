"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DictionaryResponse } from "@/types/dictionary";
import { LanguageCode } from "@/types/languages";

import { DictionaryEntryCard } from "./dictionary-entry";

interface DictionaryResultsProps {
  result: DictionaryResponse;
  languageCode: LanguageCode;
  isLoading?: boolean;
}

/**
 * The result list.
 *
 * An empty list is rendered as an empty state, not an error. That is the whole
 * behavioural difference from the form this replaces, which surfaced "word not
 * found" through the same red-bordered card as a broken service.
 */
export function DictionaryResults({
  result,
  languageCode,
  isLoading,
}: DictionaryResultsProps) {
  const { entries, query, resolvedFrom } = result;

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            No entry for <span className="font-medium">{query}</span>.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the spelling, or try the word&apos;s dictionary form.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" aria-busy={isLoading} aria-live="polite">
      {resolvedFrom && (
        // Only shown when the query was genuinely not a headword, so it reads as
        // information rather than as noise on every lookup.
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{resolvedFrom}</span>, the
          dictionary form of <span className="font-medium">{query}</span>.
        </p>
      )}

      {entries.length > 1 && (
        // Homographs are a choice, not an ambiguity to fail on.
        <p className="text-sm text-muted-foreground">
          {entries.length} entries for{" "}
          <span className="font-medium">{resolvedFrom ?? query}</span>.
        </p>
      )}

      {entries.map((entry, index) => (
        <DictionaryEntryCard
          key={`${entry.lemma}-${entry.partOfSpeech}-${index}`}
          entry={entry}
          languageCode={languageCode}
        />
      ))}
    </div>
  );
}
