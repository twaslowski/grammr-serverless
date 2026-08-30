"use client";

import { useEffect, useRef, useState } from "react";

import { lookup } from "@/lib/dictionary";
import { DictionaryEntry } from "@/types/dictionary";
import { PartOfSpeech } from "@/types/inflections";
import { LanguageCode } from "@/types/languages";

interface UseDictionaryEntryOptions {
  lemma?: string;
  pos?: PartOfSpeech;
  language: LanguageCode;
  /** Gate the lookup — pass the dialog's open state rather than fetching eagerly. */
  enabled: boolean;
}

/**
 * Fetches the dictionary entry for a lemma already identified by morphology.
 *
 * For places that know what word they are looking at and want its definitions:
 * the analysis flow has a lemma and a part of speech from the morphology service
 * before the reader clicks anything, so it can ask for the exact entry rather
 * than search.
 *
 * Failure is silent by design. This decorates a view that was useful before the
 * dictionary existed, so a missing entry or an unreachable service should leave
 * that view as it was, not put an error in front of the reader.
 */
export function useDictionaryEntry({
  lemma,
  pos,
  language,
  enabled,
}: UseDictionaryEntryOptions): {
  entry?: DictionaryEntry;
  isLoading: boolean;
} {
  const [entry, setEntry] = useState<DictionaryEntry | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Guards against a response for a previously requested word landing after a
  // newer one, which in a dialog reused across tokens would show the wrong gloss.
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled || !lemma) {
      return;
    }

    const id = ++requestId.current;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const { entries } = await lookup({ query: lemma, language, pos });
        if (cancelled || id !== requestId.current) {
          return;
        }
        // The part of speech narrows homographs, but the service is free to
        // return others; prefer an exact match and fall back to the best-ranked.
        setEntry(entries.find((e) => e.partOfSpeech === pos) ?? entries[0]);
      } catch {
        if (!cancelled && id === requestId.current) {
          setEntry(undefined);
        }
      } finally {
        if (!cancelled && id === requestId.current) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, lemma, pos, language]);

  return { entry, isLoading };
}
