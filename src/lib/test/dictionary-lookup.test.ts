import { db } from "@/db/connect";
import { callApiGateway } from "@/lib/api/api-gateway";
import { normaliseQuery, resolve } from "@/lib/dictionary-lookup";
import { DictionaryEntry } from "@/types/dictionary";

jest.mock("@/lib/api/api-gateway", () => ({
  callApiGateway: jest.fn(),
}));

jest.mock("@/db/connect", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

const mockCallApiGateway = callApiGateway as jest.Mock;

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/** `db.select().from().where()` resolves to `rows`, or rejects with `error`. */
function mockCacheRead(rows: unknown[] | Error) {
  const where =
    rows instanceof Error
      ? jest.fn().mockRejectedValue(rows)
      : jest.fn().mockResolvedValue(rows);
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({ where }),
  });
  return where;
}

/** `db.insert().values().onConflictDoUpdate()`. */
function mockCacheWrite() {
  const onConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
  const values = jest.fn().mockReturnValue({ onConflictDoUpdate });
  (db.insert as jest.Mock).mockReturnValue({ values });
  return { values, onConflictDoUpdate };
}

const artifactEntry = (lemma: string): unknown => ({
  lemma,
  partOfSpeech: "NOUN",
  lemmaFeatures: [],
  senses: [{ gloss: "a thing", tags: [] }],
  inflections: null,
});

const paradigm = (lemma: string): unknown => ({
  partOfSpeech: "VERB",
  lemma,
  lemmaFeatures: [],
  inflections: [{ lemma, inflected: `${lemma}-inflected`, features: [] }],
});

const morphology = (lemma: string, pos = "VERB"): unknown => ({
  text: "query",
  language: "ru",
  tokens: [{ text: "query", lemma, pos, features: [] }],
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCacheRead([]);
});

describe("normaliseQuery", () => {
  it("strips combining stress marks, folds ё onto е, and lowercases", () => {
    expect(normaliseQuery("Стол́")).toBe("стол");
    expect(normaliseQuery("ЁЛКА")).toBe("елка");
    expect(normaliseQuery("  стол  ")).toBe("стол");
  });
});

describe("resolve", () => {
  it("short-circuits on a cache hit without touching the artifact", async () => {
    mockCacheRead([
      {
        lemma: "стол",
        pos: "NOUN",
        lemmaFeatures: [],
        senses: [],
        inflections: null,
      },
    ]);

    const result = await resolve("стол", "ru");

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].source).toBe("generated");
    expect(mockCallApiGateway).not.toHaveBeenCalled();
  });

  it("degrades to the artifact when the cache read fails", async () => {
    mockCacheRead(new Error("connection refused"));
    mockCallApiGateway.mockResolvedValueOnce(
      jsonResponse(200, { entries: [artifactEntry("стол")] }),
    );

    const result = await resolve("стол", "ru");

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].source).toBe("wiktionary");
  });

  it("returns a direct artifact hit for a headword without calling morphology", async () => {
    mockCallApiGateway.mockResolvedValueOnce(
      jsonResponse(200, { entries: [artifactEntry("стол")] }),
    );

    const result = await resolve("стол", "ru");

    expect(result.entries).toHaveLength(1);
    expect(result.resolvedFrom).toBeUndefined();
    expect(mockCallApiGateway).toHaveBeenCalledTimes(1);
    expect(mockCallApiGateway).toHaveBeenCalledWith("/dictionary/ru", {
      query: "стол",
      pos: undefined,
    });
  });

  it("treats pos: 'X' as no hint", async () => {
    mockCallApiGateway.mockResolvedValueOnce(
      jsonResponse(200, { entries: [artifactEntry("стол")] }),
    );

    await resolve("стол", "ru", "X");

    expect(mockCallApiGateway).toHaveBeenCalledWith("/dictionary/ru", {
      query: "стол",
      pos: undefined,
    });
  });

  it("resolves an inflected form via morphology and retries the artifact", async () => {
    mockCallApiGateway
      .mockResolvedValueOnce(jsonResponse(200, { entries: [] })) // artifact miss on "шёл"
      .mockResolvedValueOnce(jsonResponse(200, morphology("идти"))) // morphology
      .mockResolvedValueOnce(
        jsonResponse(200, { entries: [artifactEntry("идти")] }),
      ); // artifact hit on "идти"

    const result = await resolve("шёл", "ru");

    expect(result.entries).toHaveLength(1);
    expect(result.resolvedFrom).toBe("идти");
    expect(mockCallApiGateway).toHaveBeenNthCalledWith(2, "/morphology/ru", {
      text: "шёл",
    });
    expect(mockCallApiGateway).toHaveBeenNthCalledWith(3, "/dictionary/ru", {
      query: "идти",
      pos: "VERB",
    });
  });

  it("falls back to the generators, caching under the resolved lemma", async () => {
    const { values } = mockCacheWrite();
    mockCallApiGateway
      .mockResolvedValueOnce(jsonResponse(200, { entries: [] })) // artifact miss on raw query
      .mockResolvedValueOnce(jsonResponse(200, morphology("идти"))) // morphology
      .mockResolvedValueOnce(jsonResponse(200, { entries: [] })) // artifact miss on lemma
      .mockResolvedValueOnce(jsonResponse(200, paradigm("идти"))); // generator

    const result = await resolve("шел", "ru");

    expect(result.resolvedFrom).toBe("идти");
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].source).toBe("generated");
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ lemma: "идти", lemmaNorm: "идти" }),
    );
  });

  it("does not generate from the raw query once a different lemma has already been resolved", async () => {
    mockCallApiGateway
      .mockResolvedValueOnce(jsonResponse(200, { entries: [] })) // artifact miss on raw query
      .mockResolvedValueOnce(jsonResponse(200, morphology("идти"))) // morphology
      .mockResolvedValueOnce(jsonResponse(200, { entries: [] })) // artifact miss on lemma
      .mockResolvedValueOnce(jsonResponse(502, {})); // generator fails too

    const result = await resolve("шел", "ru", "VERB");

    expect(result).toEqual({ entries: [] });
    // Exactly the four calls above -- no fifth call generating from "шел" itself.
    expect(mockCallApiGateway).toHaveBeenCalledTimes(4);
  });

  it("generates from the query itself when morphology cannot resolve it", async () => {
    mockCallApiGateway
      .mockResolvedValueOnce(jsonResponse(200, { entries: [] })) // artifact miss
      .mockRejectedValueOnce(new Error("gateway not configured")) // morphology unavailable
      .mockResolvedValueOnce(jsonResponse(200, paradigm("плоп"))); // generator

    const result = await resolve("плоп", "ru", "VERB");

    expect(result.resolvedFrom).toBeUndefined();
    expect(result.entries).toHaveLength(1);
  });

  it("reports not found rather than generating for a non-inflectable part of speech", async () => {
    mockCallApiGateway
      .mockResolvedValueOnce(jsonResponse(200, { entries: [] })) // artifact miss
      .mockRejectedValueOnce(new Error("gateway not configured")); // morphology unavailable

    const result = await resolve("быстро", "ru", "ADV");

    // ADV is not in InflectablePosSet, so once morphology fails to resolve a
    // distinct lemma, "nothing to generate" is the honest answer -- no third
    // call to the generators.
    expect(mockCallApiGateway).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ entries: [] });
  });
});

describe("fromArtifact entry parsing", () => {
  it("discards malformed entries instead of failing the lookup", async () => {
    mockCallApiGateway
      .mockResolvedValueOnce(
        jsonResponse(200, {
          entries: [{ lemma: "стол" /* missing partOfSpeech, inflections */ }],
        }),
      )
      .mockRejectedValueOnce(new Error("gateway not configured")); // morphology unavailable

    const result = await resolve("стол", "ru");

    expect(result.entries).toEqual([]);
  });

  it("attributes wiktionary entries with a source URL", async () => {
    mockCallApiGateway.mockResolvedValueOnce(
      jsonResponse(200, { entries: [artifactEntry("стол")] }),
    );

    const result = await resolve("стол", "ru");
    const entry: DictionaryEntry = result.entries[0];

    expect(entry.source).toBe("wiktionary");
    expect(entry.sourceUrl).toBe(
      `https://en.wiktionary.org/wiki/${encodeURIComponent("стол")}#Russian`,
    );
  });
});
