import { db } from "@/db/connect";
import { syncDeckStudies } from "@/lib/server/decks";
import { ensureProfile } from "@/lib/server/ensure-profile";

jest.mock("@/db/connect", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

jest.mock("@/lib/server/decks", () => ({
  syncDeckStudies: jest.fn(),
}));

const mockSyncDeckStudies = syncDeckStudies as jest.Mock;

/** `db.insert().values().onConflictDoNothing().returning()` resolves to `rows`. */
function mockInsert(rows: unknown[]) {
  const returning = jest.fn().mockResolvedValue(rows);
  const onConflictDoNothing = jest.fn().mockReturnValue({ returning });
  const values = jest.fn().mockReturnValue({ onConflictDoNothing });
  (db.insert as jest.Mock).mockReturnValue({ values });
  return { values, onConflictDoNothing, returning };
}

/** `db.select().from().where().limit()` resolves to `rows`. */
function mockSelect(rows: unknown[]) {
  const limit = jest.fn().mockResolvedValue(rows);
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({ limit }),
    }),
  });
  return limit;
}

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  sourceLanguage: "en",
  targetLanguage: "ru",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSyncDeckStudies.mockResolvedValue(undefined);
});

describe("ensureProfile", () => {
  it("creates a profile with the defaults when there is none", async () => {
    const { values } = mockInsert([row()]);

    const profile = await ensureProfile("user-1");

    expect(values).toHaveBeenCalledWith({
      id: "user-1",
      sourceLanguage: "en",
      targetLanguage: "ru",
    });
    expect(profile.targetLanguage).toBe("ru");
  });

  it("subscribes a newly created user to the public decks", async () => {
    mockInsert([row()]);

    await ensureProfile("user-1");

    expect(mockSyncDeckStudies).toHaveBeenCalledWith("user-1", "ru");
  });

  /**
   * The load-bearing case. This runs on every dashboard render, so an upsert
   * here — rather than `onConflictDoNothing` — would reset the language pair of
   * every existing user on every page view.
   */
  it("returns an existing profile untouched", async () => {
    const { onConflictDoNothing } = mockInsert([]);
    mockSelect([row({ sourceLanguage: "de" })]);

    const profile = await ensureProfile("user-1");

    expect(onConflictDoNothing).toHaveBeenCalled();
    expect(profile.sourceLanguage).toBe("de");
  });

  it("does not re-scan public decks for an existing profile", async () => {
    mockInsert([]);
    mockSelect([row()]);

    await ensureProfile("user-1");

    expect(mockSyncDeckStudies).not.toHaveBeenCalled();
  });

  it("throws rather than inventing a profile when the read comes back empty", async () => {
    mockInsert([]);
    mockSelect([]);

    await expect(ensureProfile("user-1")).rejects.toThrow();
  });
});
