import { z } from "zod";

import { FeatureSchema } from "@/types/feature";
import {
  InflectionSchema,
  Paradigm,
  PartOfSpeechEnum,
} from "@/types/inflections";
import { LanguageCodeSchema } from "@/types/languages";

/**
 * Dictionary lookup: what the inflection generator should have been.
 *
 * `/api/v1/inflections` needs a lemma *and* a part of speech, and answers with a
 * paradigm or an error — so it can only speak about the four parts of speech that
 * inflect, and only to callers who already know which one they are asking about.
 * A dictionary takes whatever the reader typed and answers for any word.
 */
export const DictionaryRequestSchema = z.object({
  query: z.string().min(1).max(64),
  language: LanguageCodeSchema,
  /**
   * Narrows homographs when the caller already knows the part of speech — the
   * morphology service does. Never required; that is the point.
   */
  pos: PartOfSpeechEnum.optional(),
});
export type DictionaryRequest = z.infer<typeof DictionaryRequestSchema>;

export const SenseSchema = z.object({
  gloss: z.string(),
  /** Raw Wiktionary sense tags, e.g. `["figurative"]`. */
  tags: z.array(z.string()).default([]),
});
export type Sense = z.infer<typeof SenseSchema>;

/**
 * A form from the dictionary, which is an `Inflection` plus its stressed
 * spelling.
 *
 * Extends rather than replaces `InflectionSchema` so a dictionary paradigm can be
 * handed to `InflectionsTable` and stored in `flashcard.back` without conversion.
 */
export const DictionaryInflectionSchema = InflectionSchema.extend({
  accented: z.string().nullish(),
});
export type DictionaryInflection = z.infer<typeof DictionaryInflectionSchema>;

export const DictionaryEntrySchema = z.object({
  /** Unstressed headword. Safe for TTS and flashcard fronts. */
  lemma: z.string(),
  /** Stressed spelling, for display only. Absent when identical to the lemma. */
  accented: z.string().nullish(),
  partOfSpeech: PartOfSpeechEnum,
  lemmaFeatures: z.array(FeatureSchema).default([]),
  senses: z.array(SenseSchema).default([]),
  /**
   * The paradigm, or `null` for a word that does not inflect.
   *
   * `null` and `[]` are different answers, and keeping them apart is the reason
   * this feature exists. `null` means "adverb, preposition, indeclinable noun —
   * there is no table to show"; an empty array would be indistinguishable from a
   * table that failed to extract.
   */
  inflections: z.array(DictionaryInflectionSchema).nullable(),
  /**
   * Where the entry came from. Wiktionary content is CC BY-SA, so an entry has to
   * be able to attribute itself; `"generated"` marks a paradigm the fallback
   * produced from `pymorphy3`/`verbecc`, which carries no such obligation.
   */
  source: z.enum(["wiktionary", "generated"]).default("wiktionary"),
  /** Link back to the source entry, when there is one to link to. */
  sourceUrl: z.string().nullish(),
});
export type DictionaryEntry = z.infer<typeof DictionaryEntrySchema>;

export const DictionaryResponseSchema = z.object({
  query: z.string(),
  /**
   * The lemma the query resolved to, when it was not itself a headword — typing
   * `шёл` resolves to `идти`. Absent when the query matched directly, so the UI
   * can say "showing results for …" only when that is actually true.
   */
  resolvedFrom: z.string().nullish(),
  /**
   * Empty means the word is unknown. That is a result, not an error: the old form
   * had to render it as one.
   */
  entries: z.array(DictionaryEntrySchema),
});
export type DictionaryResponse = z.infer<typeof DictionaryResponseSchema>;

/** Whether an entry has a paradigm worth rendering a table for. */
export function isInflected(entry: DictionaryEntry): boolean {
  return (entry.inflections?.length ?? 0) > 0;
}

/**
 * Whether the entry says outright that the word has no paradigm by nature.
 *
 * Distinct from "no table available": an indeclinable noun is a fact about the
 * word, not a gap in the data, and the entry should say so.
 */
export function isExplicitlyUninflectable(entry: DictionaryEntry): boolean {
  return entry.lemmaFeatures.some(
    (feature) => feature.type === "OTHER" && feature.value === "INDECLINABLE",
  );
}

/**
 * Views a dictionary entry as a `Paradigm`, so `InflectionsTable` can render it
 * unchanged.
 *
 * Returns `null` when there is nothing to render, which the caller should treat
 * as "show senses only" rather than as a failure.
 */
export function toParadigm(entry: DictionaryEntry): Paradigm | null {
  if (!entry.inflections?.length) {
    return null;
  }

  return {
    partOfSpeech: entry.partOfSpeech,
    lemma: entry.lemma,
    lemmaFeatures: entry.lemmaFeatures,
    inflections: entry.inflections.map(({ lemma, inflected, features }) => ({
      lemma,
      inflected,
      features,
    })),
  };
}

/**
 * Builds the Wiktionary URL for an entry.
 *
 * The section anchor is the English name of the language the word belongs to,
 * because the English edition puts every language's entry for a spelling on one
 * page.
 */
const WIKTIONARY_SECTIONS: Partial<
  Record<z.infer<typeof LanguageCodeSchema>, string>
> = {
  ru: "Russian",
  de: "German",
  es: "Spanish",
  it: "Italian",
  fr: "French",
  pt: "Portuguese",
  en: "English",
};

export function wiktionaryUrl(
  lemma: string,
  language: z.infer<typeof LanguageCodeSchema>,
): string {
  const section = WIKTIONARY_SECTIONS[language];
  const page = encodeURIComponent(lemma);
  return `https://en.wiktionary.org/wiki/${page}${section ? `#${section}` : ""}`;
}
