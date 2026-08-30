import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import type { Sense } from "@/types/dictionary";
import type { Feature } from "@/types/feature";
import type { Inflection, PartOfSpeech } from "@/types/inflections";
import type { LanguageCode } from "@/types/languages";

/**
 * Write-through cache for dictionary entries the artifact does not contain.
 *
 * The dictionary artifact is an immutable SQLite file in S3, so there is nowhere
 * to put a result derived at runtime. When a lookup misses and the generator
 * Lambdas (`pymorphy3`, `verbecc`) can still produce a paradigm, the answer lands
 * here instead. Two things follow from that:
 *
 * - The long tail fills in over time -- neologisms, names and rare forms that
 *   Wiktionary lacks but a morphological analyser handles fine.
 * - Repeat lookups stop re-invoking a Lambda. Nothing else in the system caches
 *   NLP results today; identical lemmas are resolved from scratch every time.
 *
 * Rows are derived data, never user data. They are safe to truncate: doing so
 * costs a round of regeneration and nothing else. That is also why there is no
 * `pgPolicy` here -- there is no owner to filter on, and the pooler role bypasses
 * RLS anyway (see `src/db/README.md`).
 */
export const lexemeCache = pgTable(
  "lexeme_cache",
  {
    id: serial().primaryKey().notNull(),
    language: varchar({ length: 3 }).$type<LanguageCode>().notNull(),
    /** Unstressed dictionary form, as the generators return it. */
    lemma: text().notNull(),
    /**
     * The lookup key: `lemma` casefolded, unstressed and with `ё` folded onto
     * `е`, matching `normaliseQuery` in `src/lib/dictionary-lookup.ts` and the
     * `norm` columns in the SQLite artifact.
     *
     * Stored rather than derived in a functional index, because the unique
     * constraint doubles as an upsert conflict target and Drizzle can only name
     * plain columns there.
     */
    lemmaNorm: text("lemma_norm").notNull(),
    pos: text().$type<PartOfSpeech>().notNull(),
    /** Inherent features of the lexeme; see `Paradigm.lemmaFeatures`. */
    lemmaFeatures: jsonb("lemma_features").$type<Feature[]>().notNull(),
    /**
     * Definitions, when the fallback could establish any. Often empty: the
     * generators produce forms, not meanings, so a cached entry is frequently a
     * paradigm with no gloss. That is still worth serving.
     */
    senses: jsonb().$type<Sense[]>().notNull(),
    /**
     * The paradigm, or `null` for a word that does not inflect. Null and `[]`
     * are different answers here exactly as they are in the artifact.
     */
    inflections: jsonb().$type<Inflection[] | null>(),
    /**
     * Which fallback produced this. Recorded so a future artifact rebuild can
     * evict rows that Wiktionary has since started covering, and so a bad
     * generator can be cleared out by source rather than wholesale.
     */
    source: text().notNull(),
    /** Cheap popularity signal, useful for deciding what to promote later. */
    hits: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    // The same lemma can exist under several parts of speech, so the identity of
    // a cached entry is the triple rather than the lemma alone. Doubles as the
    // upsert conflict target.
    uniqueIndex("idx_lexeme_cache_identity").on(
      table.language,
      table.lemmaNorm,
      table.pos,
    ),
    // The read path does not always know the part of speech -- that is the whole
    // point of the dictionary -- so it has to be able to fetch every reading of a
    // lemma at once.
    index("idx_lexeme_cache_lemma").on(table.language, table.lemmaNorm),
  ],
);
