import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/connect";
import { lexemeCache } from "@/db/schemas/lexemeCache";
import { callApiGateway } from "@/lib/api/api-gateway";
import {
  DictionaryEntry,
  DictionaryEntrySchema,
  wiktionaryUrl,
} from "@/types/dictionary";
import { Paradigm, ParadigmSchema, PartOfSpeech } from "@/types/inflections";
import { InflectablePosSet } from "@/types/inflections";
import { LanguageCode } from "@/types/languages";
import { MorphologicalAnalysisSchema } from "@/types/morphology";

/**
 * Server-side resolution of a dictionary lookup.
 *
 * Four sources, tried in order, and the ordering is the design:
 *
 * 1. **The cache** — entries a previous fallback generated. Cheapest, and it is
 *    the only one that improves over time.
 * 2. **The artifact** — the wiktextract dictionary, which is authoritative for
 *    senses and is the only source that can say "real word, no paradigm".
 * 3. **The morphology service** — if the query was not a headword it may be an
 *    inflected form, so lemmatise and try the artifact again. Reusing the
 *    deployed spaCy/pymorphy3 analyser keeps lemmatisation in the one place that
 *    already does it, instead of shipping a form index.
 * 4. **The generators** — `pymorphy3`/`verbecc` still handle names, neologisms
 *    and rare words Wiktionary lacks. What they produce is written back to the
 *    cache, so the long tail fills in with use.
 *
 * Every step is allowed to fail without failing the lookup. A dictionary that
 * answers "nothing found" is more useful than one that answers "error", which is
 * what the endpoint this replaces had to do.
 */

interface Resolution {
  entries: DictionaryEntry[];
  /** The lemma the query resolved to, if it was not itself a headword. */
  resolvedFrom?: string;
}

/** Mirrors `normalise` in the Lambda and the builder: the cache keys must agree. */
export function normaliseQuery(query: string): string {
  return query
    .normalize("NFD")
    .replaceAll("́", "")
    .normalize("NFC")
    .toLowerCase()
    .replaceAll("ё", "е")
    .trim();
}

export async function resolve(
  query: string,
  language: LanguageCode,
  requestedPos?: PartOfSpeech,
): Promise<Resolution> {
  // `PartOfSpeechEnum` maps anything it does not recognise to "X" rather than
  // rejecting it, so a bad hint would arrive here as a filter that matches
  // nothing. Treat it as no hint at all: narrowing is a convenience, and a
  // convenience should not be able to hide every result.
  const pos = requestedPos === "X" ? undefined : requestedPos;

  const cached = await fromCache(query, language, pos);
  if (cached.length > 0) {
    return { entries: cached };
  }

  const direct = await fromArtifact(query, language, pos);
  if (direct.length > 0) {
    return { entries: direct };
  }

  // The query was not a headword. It may still be an inflected form, which is
  // the case the old form could not handle at all.
  const lemma = await lemmatise(query, language);
  if (lemma && normaliseQuery(lemma.lemma) !== normaliseQuery(query)) {
    const viaLemma = await fromArtifact(
      lemma.lemma,
      language,
      pos ?? lemma.pos,
    );
    if (viaLemma.length > 0) {
      return { entries: viaLemma, resolvedFrom: lemma.lemma };
    }

    const generated = await fromGenerators(lemma.lemma, language, lemma.pos);
    if (generated) {
      return { entries: [generated], resolvedFrom: lemma.lemma };
    }
  }

  // Last resort: treat the query itself as a lemma the generators might know --
  // a name or a neologism Wiktionary lacks.
  //
  // Only when nothing else resolved it to a *different* lemma. Otherwise this
  // would generate a paradigm from an inflected form and return it without
  // `resolvedFrom`, so the UI would present it as though the reader had typed
  // the dictionary form.
  if (lemma && normaliseQuery(lemma.lemma) !== normaliseQuery(query)) {
    return { entries: [] };
  }

  const generated = await fromGenerators(query, language, pos ?? lemma?.pos);
  return { entries: generated ? [generated] : [] };
}

async function fromCache(
  query: string,
  language: LanguageCode,
  pos?: PartOfSpeech,
): Promise<DictionaryEntry[]> {
  const norm = normaliseQuery(query);

  try {
    const rows = await db
      .select()
      .from(lexemeCache)
      .where(
        and(
          eq(lexemeCache.language, language),
          eq(lexemeCache.lemmaNorm, norm),
          ...(pos ? [eq(lexemeCache.pos, pos)] : []),
        ),
      );

    return rows.map((row) => ({
      lemma: row.lemma,
      partOfSpeech: row.pos,
      lemmaFeatures: row.lemmaFeatures,
      senses: row.senses,
      inflections: row.inflections,
      source: "generated" as const,
      sourceUrl: null,
    }));
  } catch (error) {
    // A cache that is unreachable is a slow lookup, not a failed one.
    console.warn("Dictionary cache read failed:", error);
    return [];
  }
}

async function fromArtifact(
  query: string,
  language: LanguageCode,
  pos?: PartOfSpeech,
): Promise<DictionaryEntry[]> {
  let response: Response;
  try {
    response = await callApiGateway(`/dictionary/${language}`, { query, pos });
  } catch {
    // Not configured, or the language has no published artifact. Either way the
    // fallback chain continues.
    return [];
  }

  if (!response.ok) {
    if (response.status !== 404) {
      console.warn(
        `Dictionary service returned ${response.status} for ${language}/${query}`,
      );
    }
    return [];
  }

  const payload = await response.json().catch(() => null);
  const entries: unknown[] = Array.isArray(payload?.entries)
    ? payload.entries
    : [];

  return entries.flatMap((raw) => {
    const parsed = DictionaryEntrySchema.safeParse({
      ...(raw as object),
      source: "wiktionary",
    });
    if (!parsed.success) {
      console.warn(
        "Discarding malformed dictionary entry:",
        parsed.error.message,
      );
      return [];
    }
    return [
      { ...parsed.data, sourceUrl: wiktionaryUrl(parsed.data.lemma, language) },
    ];
  });
}

/**
 * Resolves an inflected form to its lemma using the deployed morphology service.
 *
 * Only the first token is considered: the dictionary takes a word, and analysing
 * a whole phrase here would silently answer about part of it.
 */
async function lemmatise(
  query: string,
  language: LanguageCode,
): Promise<{ lemma: string; pos: PartOfSpeech } | undefined> {
  let response: Response;
  try {
    response = await callApiGateway(`/morphology/${language}`, { text: query });
  } catch {
    return undefined;
  }

  if (!response.ok) {
    return undefined;
  }

  const parsed = MorphologicalAnalysisSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!parsed.success) {
    return undefined;
  }

  const token = parsed.data.tokens[0];
  return token ? { lemma: token.lemma, pos: token.pos } : undefined;
}

/**
 * Asks the inflection generators for a paradigm, and caches what comes back.
 *
 * The generators cannot define a word, so an entry from here has a paradigm and
 * no senses. That is still worth serving: a learner who typed a name or a
 * neologism gets its declension rather than an error card.
 */
async function fromGenerators(
  lemma: string,
  language: LanguageCode,
  pos?: PartOfSpeech,
): Promise<DictionaryEntry | undefined> {
  if (!pos || !InflectablePosSet.has(pos)) {
    // Nothing to generate. Reporting "not found" is the honest answer.
    return undefined;
  }

  let response: Response;
  try {
    response = await callApiGateway(`/inflections/${language}`, { lemma, pos });
  } catch {
    return undefined;
  }

  if (!response.ok) {
    return undefined;
  }

  const parsed = ParadigmSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!parsed.success) {
    return undefined;
  }

  const entry: DictionaryEntry = {
    lemma: parsed.data.lemma,
    partOfSpeech: parsed.data.partOfSpeech,
    lemmaFeatures: parsed.data.lemmaFeatures,
    senses: [],
    inflections: parsed.data.inflections.length
      ? parsed.data.inflections
      : null,
    source: "generated",
    sourceUrl: null,
  };

  await cache(entry, language, parsed.data);
  return entry;
}

async function cache(
  entry: DictionaryEntry,
  language: LanguageCode,
  paradigm: Paradigm,
): Promise<void> {
  try {
    await db
      .insert(lexemeCache)
      .values({
        language,
        lemma: entry.lemma,
        lemmaNorm: normaliseQuery(entry.lemma),
        pos: entry.partOfSpeech,
        lemmaFeatures: paradigm.lemmaFeatures,
        senses: entry.senses,
        inflections: entry.inflections,
        source: "generated",
      })
      // A concurrent request may have written the same entry. Counting the hit is
      // more useful than failing, and tells us later which cached rows earn their
      // keep.
      .onConflictDoUpdate({
        target: [lexemeCache.language, lexemeCache.lemmaNorm, lexemeCache.pos],
        set: {
          hits: sql`${lexemeCache.hits} + 1`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });
  } catch (error) {
    // Failing to cache is not failing to answer.
    console.warn("Dictionary cache write failed:", error);
  }
}
