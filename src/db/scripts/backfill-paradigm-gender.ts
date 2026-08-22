/**
 * Brings paradigms stored in `flashcard.back` up to the current shape, in which
 * gender is modelled differently per part of speech.
 *
 * Two things are repaired, both consequences of the same change:
 *
 * - **Nouns** gained `lemmaFeatures`, which records gender as a property of the
 *   lexeme rather than of a single cell. Gender is not derivable from what is
 *   already in the row, so it is looked up against the inflections service.
 * - **Adjectives** gained gender as an inflectional dimension. Paradigms stored
 *   before the change hold 12 gender-less cells whose forms all happen to be
 *   whichever gender the analyser's top parse carried, so they are refetched
 *   and replaced wholesale with the 24-cell version.
 *
 * Every other part of speech has no inherent features and no new cells, so it
 * only needs an empty `lemmaFeatures`, filled in locally without a request.
 * This mirrors `Inflector._derive_lemma_features` in `lambda/inflections-ru`.
 *
 * The script is idempotent, and each repair is independent: a paradigm that
 * already has `lemmaFeatures` but still lacks gendered forms is rewritten, and
 * vice versa. Anything that cannot be established is left untouched and
 * reported, so a re-run picks up only what is still outstanding.
 *
 * Usage:
 *   pnpm db:backfill-paradigm-gender            # dry run, reports what would change
 *   pnpm db:backfill-paradigm-gender --apply    # writes
 *
 * Reads DATABASE_URL, API_GW_URL and API_GW_API_KEY from the environment.
 */
import "dotenv/config";

import postgres from "postgres";

import type { Feature } from "@/types/feature";

/** Only nouns carry inherent features that have to be fetched. */
const POS_WITH_INHERENT_FEATURES = new Set(["NOUN"]);

/** Only adjectives inflect for gender, so only they can need new cells. */
const POS_INFLECTING_FOR_GENDER = new Set(["ADJ"]);

/** The inflections service only models gender for Russian. */
const LANGUAGES_WITH_GENDER = new Set(["ru"]);

const LOOKUP_CONCURRENCY = 4;

/**
 * The stored shapes, described loosely on purpose.
 *
 * These rows predate the current schema, so they are not guaranteed to satisfy
 * it. Note that the backfill deliberately does not round-trip the JSON through
 * `ParadigmSchema`: Zod would strip any property the schema does not declare,
 * quietly discarding data this migration has no business touching.
 */
type InflectionJson = {
  lemma?: string;
  inflected?: string;
  features?: Feature[];
};

type ParadigmJson = {
  partOfSpeech?: string;
  lemma?: string;
  lemmaFeatures?: Feature[];
  inflections?: InflectionJson[];
};

type BackJson = {
  type?: string;
  language?: string;
  paradigm?: ParadigmJson;
  tokens?: { paradigm?: ParadigmJson }[];
};

interface FlashcardRow {
  id: number;
  back: BackJson;
  deckLanguage: string | null;
}

/** A paradigm as the inflections service returns it today. */
interface FetchedParadigm {
  lemma: string;
  partOfSpeech: string;
  lemmaFeatures: Feature[];
  inflections: InflectionJson[];
}

type Lookup =
  | { status: "resolved"; paradigm: FetchedParadigm }
  | { status: "failed"; reason: string };

/** Every paradigm embedded in a back, as live references into the row's JSON. */
function paradigmsIn(back: BackJson): ParadigmJson[] {
  if (back.type === "word") {
    return back.paradigm ? [back.paradigm] : [];
  }

  if (back.type === "analysis") {
    return (back.tokens ?? []).flatMap((token) =>
      token.paradigm ? [token.paradigm] : [],
    );
  }

  return [];
}

/** Analysis backs record their own language; word backs inherit the deck's. */
function languageOf(
  back: BackJson,
  deckLanguage: string | null,
): string | null {
  return back.language ?? deckLanguage;
}

function hasGenderedForms(paradigm: ParadigmJson): boolean {
  return (paradigm.inflections ?? []).some((inflection) =>
    (inflection.features ?? []).some((feature) => feature.type === "GENDER"),
  );
}

function needsLemmaFeatures(paradigm: ParadigmJson): boolean {
  return paradigm.lemmaFeatures === undefined;
}

function needsGenderedForms(paradigm: ParadigmJson): boolean {
  return (
    POS_INFLECTING_FOR_GENDER.has(paradigm.partOfSpeech ?? "") &&
    !hasGenderedForms(paradigm)
  );
}

/** True when answering this paradigm requires asking the service. */
function needsLookup(paradigm: ParadigmJson): boolean {
  const pos = paradigm.partOfSpeech ?? "";

  return (
    (POS_WITH_INHERENT_FEATURES.has(pos) && needsLemmaFeatures(paradigm)) ||
    needsGenderedForms(paradigm)
  );
}

function lookupKey(language: string, pos: string, lemma: string): string {
  return `${language}:${pos}:${lemma}`;
}

async function fetchParadigm(
  language: string,
  pos: string,
  lemma: string,
): Promise<FetchedParadigm> {
  const endpoint = process.env.API_GW_URL;
  const apiKey = process.env.API_GW_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("API_GW_URL or API_GW_API_KEY is not set");
  }

  const response = await fetch(`${endpoint}/inflections/${language}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ lemma, pos }),
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${(await response.text()).trim()}`,
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.lemmaFeatures)) {
    throw new Error(
      "response carries no lemmaFeatures — the deployed inflections lambda " +
        "predates the field, so there is nothing to backfill from",
    );
  }

  if (!Array.isArray(data.inflections) || data.inflections.length === 0) {
    throw new Error("response carries no inflections");
  }

  // A different normal form means the service resolved a different lexeme than
  // the one on the card, so its forms must not be written over ours.
  if (data.lemma !== lemma) {
    throw new Error(`service answered for "${data.lemma}", not "${lemma}"`);
  }

  return data as FetchedParadigm;
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        await fn(items[cursor++]);
      }
    },
  );

  await Promise.all(workers);
}

async function main() {
  const apply = process.argv.includes("--apply");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { prepare: false });

  try {
    const rows = await sql<FlashcardRow[]>`
      select f.id, f.back, d.language as "deckLanguage"
      from flashcard f
      left join deck d on d.id = f.deck_id
      where f.back->>'type' in ('word', 'analysis')
      order by f.id
    `;

    // Pair each paradigm needing work with the context to resolve it. The
    // paradigm objects are references into `row.back`, so repairing them
    // mutates the back that gets written later.
    const pending = rows.flatMap((row) => {
      const language = languageOf(row.back, row.deckLanguage);

      return paradigmsIn(row.back)
        .filter(
          (paradigm) =>
            needsLemmaFeatures(paradigm) || needsGenderedForms(paradigm),
        )
        .map((paradigm) => ({ row, paradigm, language }));
    });

    const totalParadigms = rows.reduce(
      (count, row) => count + paradigmsIn(row.back).length,
      0,
    );

    console.log(
      `${rows.length} flashcards hold ${totalParadigms} paradigms, ` +
        `${pending.length} of them outdated`,
    );

    // Look up each distinct lexeme once: the same lemma recurs across decks and
    // across the tokens of an analysis.
    const lookups = new Map<
      string,
      { language: string; pos: string; lemma: string }
    >();
    for (const { paradigm, language } of pending) {
      const pos = paradigm.partOfSpeech;
      const lemma = paradigm.lemma;

      if (!pos || !lemma || !language) continue;
      if (!LANGUAGES_WITH_GENDER.has(language)) continue;
      if (!needsLookup(paradigm)) continue;

      lookups.set(lookupKey(language, pos, lemma), { language, pos, lemma });
    }

    console.log(
      `resolving ${lookups.size} distinct lexemes against ${process.env.API_GW_URL}`,
    );

    const resolved = new Map<string, Lookup>();
    await mapWithConcurrency(
      [...lookups.values()],
      LOOKUP_CONCURRENCY,
      async ({ language, pos, lemma }) => {
        const key = lookupKey(language, pos, lemma);
        try {
          resolved.set(key, {
            status: "resolved",
            paradigm: await fetchParadigm(language, pos, lemma),
          });
        } catch (error) {
          resolved.set(key, {
            status: "failed",
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );

    const changedRows = new Set<number>();
    const skipped: { lemma: string; pos: string; reason: string }[] = [];
    let featuresFilled = 0;
    let gendersRecorded = 0;
    let formsRewritten = 0;

    for (const { row, paradigm, language } of pending) {
      const pos = paradigm.partOfSpeech;
      const lemma = paradigm.lemma;

      if (!pos || !lemma) {
        skipped.push({
          lemma: lemma ?? "?",
          pos: pos ?? "?",
          reason: "paradigm has no lemma or part of speech",
        });
        continue;
      }

      const skip = (reason: string) => skipped.push({ lemma, pos, reason });

      // Resolve the service answer once, if this paradigm needs one at all.
      let fetched: FetchedParadigm | undefined;
      if (needsLookup(paradigm)) {
        if (!language) {
          skip("no language on the card or its deck");
          continue;
        }
        if (!LANGUAGES_WITH_GENDER.has(language)) {
          skip(`no gender source for language "${language}"`);
          continue;
        }

        const lookup = resolved.get(lookupKey(language, pos, lemma));

        if (!lookup || lookup.status === "failed") {
          skip(lookup?.reason ?? "lookup did not run");
          continue;
        }

        fetched = lookup.paradigm;
      }

      let changed = false;

      // Adjectives: swap in the gendered cells, which also carry the newer
      // inflection features. Guard against a service that would hand back the
      // same gender-less shape, leaving the card no better off.
      if (needsGenderedForms(paradigm)) {
        if (!fetched || !hasGenderedForms(fetched)) {
          skip("service returned no gendered forms");
          continue;
        }

        const before = paradigm.inflections?.length ?? 0;
        paradigm.inflections = fetched.inflections;
        formsRewritten++;
        changed = true;

        console.log(
          `  rewrote ${pos} ${lemma}: ${before} → ${fetched.inflections.length} cells`,
        );
      }

      if (needsLemmaFeatures(paradigm)) {
        // Only nouns have anything inherent to record; everything else is
        // empty by definition and never needed a lookup.
        let features: Feature[] = [];

        if (POS_WITH_INHERENT_FEATURES.has(pos)) {
          if (!fetched) {
            skip("lookup did not run");
            continue;
          }
          features = fetched.lemmaFeatures;
        }

        paradigm.lemmaFeatures = features;
        featuresFilled++;
        if (features.length > 0) gendersRecorded++;
        changed = true;
      }

      if (changed) changedRows.add(row.id);
    }

    const updates = rows.filter((row) => changedRows.has(row.id));

    console.log(
      `\n${featuresFilled} paradigms given lemmaFeatures (${gendersRecorded} with a gender), ` +
        `${formsRewritten} adjectives rewritten with gendered forms, ` +
        `across ${updates.length} flashcards`,
    );

    if (skipped.length > 0) {
      console.log(`\n${skipped.length} paradigms left untouched:`);
      for (const entry of skipped) {
        console.log(`  ${entry.pos} ${entry.lemma}: ${entry.reason}`);
      }
    }

    if (!apply) {
      console.log("\ndry run, nothing written — pass --apply to write");
      return;
    }

    await sql.begin(async (tx) => {
      for (const row of updates) {
        await tx`update flashcard set back = ${sql.json(row.back)} where id = ${row.id}`;
      }
    });

    console.log(`\nwrote ${updates.length} flashcards`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
