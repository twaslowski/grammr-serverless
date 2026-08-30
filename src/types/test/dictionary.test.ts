import {
  DictionaryEntry,
  DictionaryEntrySchema,
  DictionaryResponseSchema,
  isExplicitlyUninflectable,
  isInflected,
  toParadigm,
  wiktionaryUrl,
} from "@/types/dictionary";

const noun: DictionaryEntry = {
  lemma: "стол",
  accented: "сто́л",
  partOfSpeech: "NOUN",
  lemmaFeatures: [
    { type: "GENDER", value: "MASC" },
    { type: "ANIMACY", value: "INAN" },
  ],
  senses: [{ gloss: "table", tags: [] }],
  inflections: [
    {
      lemma: "стол",
      inflected: "стола",
      accented: "стола́",
      features: [
        { type: "CASE", value: "GEN" },
        { type: "NUMBER", value: "SING" },
      ],
    },
  ],
  source: "wiktionary",
  sourceUrl: "https://en.wiktionary.org/wiki/%D1%81%D1%82%D0%BE%D0%BB#Russian",
};

const adverb: DictionaryEntry = {
  lemma: "быстро",
  partOfSpeech: "ADV",
  lemmaFeatures: [],
  senses: [{ gloss: "quickly", tags: [] }],
  inflections: null,
  source: "wiktionary",
};

/** An entry with one field removed, for asserting what the schema insists on. */
function without(
  entry: DictionaryEntry,
  key: keyof DictionaryEntry,
): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...entry };
  delete copy[key];
  return copy;
}

describe("DictionaryEntrySchema", () => {
  it("keeps a null paradigm distinct from an empty one", () => {
    // The whole feature turns on this: null means "does not inflect", which is
    // an answer, and [] would be indistinguishable from a failed extraction.
    expect(DictionaryEntrySchema.parse(adverb).inflections).toBeNull();
    expect(
      DictionaryEntrySchema.parse({ ...adverb, inflections: [] }).inflections,
    ).toEqual([]);
  });

  it("requires inflections to be present, even as null", () => {
    // Making it optional would let a producer omit it and have the entry read as
    // "does not inflect", which is a claim rather than an absence.
    expect(
      DictionaryEntrySchema.safeParse(without(adverb, "inflections")).success,
    ).toBe(false);
  });

  it("defaults source to wiktionary", () => {
    expect(DictionaryEntrySchema.parse(without(adverb, "source")).source).toBe(
      "wiktionary",
    );
  });

  it("defaults senses and lemmaFeatures to empty arrays", () => {
    const parsed = DictionaryEntrySchema.parse({
      lemma: "и",
      partOfSpeech: "CCONJ",
      inflections: null,
    });
    expect(parsed.senses).toEqual([]);
    expect(parsed.lemmaFeatures).toEqual([]);
  });

  it("falls back to X for a part of speech it does not know", () => {
    const parsed = DictionaryEntrySchema.parse({
      ...adverb,
      partOfSpeech: "PARTICIPLE",
    });
    expect(parsed.partOfSpeech).toBe("X");
  });

  it("normalises a feature type it does not know to OTHER", () => {
    const parsed = DictionaryEntrySchema.parse({
      ...adverb,
      lemmaFeatures: [{ type: "REGISTER", value: "FORMAL" }],
    });
    expect(parsed.lemmaFeatures[0].type).toBe("OTHER");
  });
});

describe("DictionaryResponseSchema", () => {
  it("accepts an empty result, because an unknown word is not an error", () => {
    const parsed = DictionaryResponseSchema.parse({
      query: "несуществующее",
      entries: [],
    });
    expect(parsed.entries).toEqual([]);
  });

  it("carries the resolved lemma when the query was an inflected form", () => {
    const parsed = DictionaryResponseSchema.parse({
      query: "шёл",
      resolvedFrom: "идти",
      entries: [],
    });
    expect(parsed.resolvedFrom).toBe("идти");
  });
});

describe("isInflected", () => {
  it("is true for an entry with cells", () => {
    expect(isInflected(noun)).toBe(true);
  });

  it("is false for a null paradigm", () => {
    expect(isInflected(adverb)).toBe(false);
  });

  it("is false for an empty paradigm", () => {
    expect(isInflected({ ...noun, inflections: [] })).toBe(false);
  });
});

describe("isExplicitlyUninflectable", () => {
  it("recognises the indeclinable marker", () => {
    expect(
      isExplicitlyUninflectable({
        ...adverb,
        lemma: "кофе",
        lemmaFeatures: [{ type: "OTHER", value: "INDECLINABLE" }],
      }),
    ).toBe(true);
  });

  it("does not treat an ordinary uninflected word as indeclinable", () => {
    // An adverb having no paradigm is a fact about adverbs; indeclinability is a
    // fact about a particular noun, and the entry should say the right one.
    expect(isExplicitlyUninflectable(adverb)).toBe(false);
  });
});

describe("toParadigm", () => {
  it("projects an entry onto the shape InflectionsTable renders", () => {
    const paradigm = toParadigm(noun);
    expect(paradigm).toEqual({
      partOfSpeech: "NOUN",
      lemma: "стол",
      lemmaFeatures: noun.lemmaFeatures,
      inflections: [
        {
          lemma: "стол",
          inflected: "стола",
          features: [
            { type: "CASE", value: "GEN" },
            { type: "NUMBER", value: "SING" },
          ],
        },
      ],
    });
  });

  it("drops the stress marks, which Paradigm has no room for", () => {
    // `flashcard.back` stores a Paradigm verbatim, so smuggling an extra field
    // through would widen the persisted shape by accident.
    const paradigm = toParadigm(noun);
    expect(paradigm!.inflections[0]).not.toHaveProperty("accented");
  });

  it("returns null rather than an empty paradigm for a word that does not inflect", () => {
    expect(toParadigm(adverb)).toBeNull();
    expect(toParadigm({ ...noun, inflections: [] })).toBeNull();
  });
});

describe("wiktionaryUrl", () => {
  it("anchors on the language section, since one page holds every language", () => {
    expect(wiktionaryUrl("Tisch", "de")).toBe(
      "https://en.wiktionary.org/wiki/Tisch#German",
    );
  });

  it("percent-encodes a non-Latin headword", () => {
    expect(wiktionaryUrl("стол", "ru")).toBe(
      "https://en.wiktionary.org/wiki/%D1%81%D1%82%D0%BE%D0%BB#Russian",
    );
  });
});
