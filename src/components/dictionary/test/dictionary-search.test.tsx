import "@testing-library/jest-dom";

import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { lookup } from "@/lib/dictionary";
import { DictionaryEntry, DictionaryResponse } from "@/types/dictionary";
import { DictionarySearch } from "../dictionary-search";

jest.mock("@/lib/dictionary", () => ({ lookup: jest.fn() }));
jest.mock("@/components/flashcard", () => ({
  CreateFlashcardDialog: () => null,
}));
jest.mock("@/components/tts/tts-button", () => ({ TTSButton: () => null }));

const mockLookup = lookup as jest.MockedFunction<typeof lookup>;

const entry = (overrides: Partial<DictionaryEntry> = {}): DictionaryEntry => ({
  lemma: "стол",
  partOfSpeech: "NOUN",
  lemmaFeatures: [],
  senses: [{ gloss: "table", tags: [] }],
  inflections: null,
  source: "wiktionary",
  sourceUrl: "https://en.wiktionary.org/wiki/table#Russian",
  ...overrides,
});

const response = (
  overrides: Partial<DictionaryResponse> = {},
): DictionaryResponse => ({
  query: "стол",
  entries: [entry()],
  ...overrides,
});

const renderSearch = () =>
  render(<DictionarySearch languageCode="ru" languageName="Russian" />);

const field = () => screen.getByRole("searchbox");

/** Types into the field and lets the debounce elapse. */
async function search(term: string) {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await user.type(field(), term);
  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  return user;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockLookup.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("DictionarySearch", () => {
  describe("the form", () => {
    it("asks for any word, not a base form", () => {
      renderSearch();
      expect(field()).toHaveAttribute(
        "placeholder",
        "Look up any Russian word...",
      );
    });

    it("has no part-of-speech selector", () => {
      // Making the reader classify a word before looking it up is the friction
      // being removed; homographs are offered as a choice in the results instead.
      renderSearch();
      expect(
        screen.queryByRole("button", { name: "Noun" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Verb" }),
      ).not.toBeInTheDocument();
    });

    it("has no submit button, because lookup is debounced", () => {
      renderSearch();
      expect(
        screen.queryByRole("button", { name: /inflect/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("searching", () => {
    it("looks the word up after the debounce and shows the entry", async () => {
      mockLookup.mockResolvedValue(response());
      renderSearch();
      await search("стол");

      await waitFor(() =>
        expect(mockLookup).toHaveBeenCalledWith({
          query: "стол",
          language: "ru",
        }),
      );
      expect(await screen.findByText("table")).toBeInTheDocument();
    });

    it("issues one request for a burst of keystrokes", async () => {
      mockLookup.mockResolvedValue(response());
      renderSearch();
      await search("стол");

      await waitFor(() => expect(mockLookup).toHaveBeenCalledTimes(1));
    });

    it("does not search on an empty field", async () => {
      renderSearch();
      await act(async () => {
        jest.advanceTimersByTime(400);
      });
      expect(mockLookup).not.toHaveBeenCalled();
    });

    it("clears the results when the field is emptied", async () => {
      mockLookup.mockResolvedValue(response());
      renderSearch();
      const user = await search("стол");
      expect(await screen.findByText("table")).toBeInTheDocument();

      await user.clear(field());
      await waitFor(() =>
        expect(screen.queryByText("table")).not.toBeInTheDocument(),
      );
    });
  });

  describe("results", () => {
    it("reports an unknown word as an empty state rather than an error", async () => {
      // The form this replaces surfaced "not found" through the same red card as
      // a broken service.
      mockLookup.mockResolvedValue({ query: "несуществующее", entries: [] });
      renderSearch();
      await search("несуществующее");

      expect(await screen.findByText(/No entry for/)).toBeInTheDocument();
      expect(
        screen.queryByText(/Something went wrong/),
      ).not.toBeInTheDocument();
    });

    it("says which lemma an inflected query resolved to", async () => {
      mockLookup.mockResolvedValue({
        query: "шёл",
        resolvedFrom: "идти",
        entries: [entry({ lemma: "идти", partOfSpeech: "VERB" })],
      });
      renderSearch();
      await search("шёл");

      const note = await screen.findByText(/dictionary form of/);
      expect(within(note).getByText("идти")).toBeInTheDocument();
    });

    it("stays quiet about resolution when the query was itself a headword", async () => {
      mockLookup.mockResolvedValue(response());
      renderSearch();
      await search("стол");

      await screen.findByText("table");
      expect(screen.queryByText(/dictionary form of/)).not.toBeInTheDocument();
    });

    it("offers every reading of a homograph", async () => {
      mockLookup.mockResolvedValue({
        query: "стать",
        entries: [
          entry({
            lemma: "стать",
            partOfSpeech: "NOUN",
            senses: [{ gloss: "bearing", tags: [] }],
          }),
          entry({
            lemma: "стать",
            partOfSpeech: "VERB",
            senses: [{ gloss: "to become", tags: [] }],
          }),
        ],
      });
      renderSearch();
      await search("стать");

      expect(await screen.findByText("bearing")).toBeInTheDocument();
      expect(screen.getByText("to become")).toBeInTheDocument();
      expect(screen.getByText(/2 entries for/)).toBeInTheDocument();
    });

    it("surfaces a genuine failure as an error", async () => {
      mockLookup.mockRejectedValue(new Error("Service not configured"));
      renderSearch();
      await search("стол");

      expect(
        await screen.findByText(/Service not configured/),
      ).toBeInTheDocument();
    });

    it("ignores a slow earlier response that resolves after a later one", async () => {
      // Otherwise a stale result paints over the one the reader is waiting for.
      let resolveFirst: (value: DictionaryResponse) => void = () => {};
      mockLookup
        .mockImplementationOnce(
          () => new Promise<DictionaryResponse>((r) => (resolveFirst = r)),
        )
        .mockResolvedValueOnce({
          query: "стать",
          entries: [entry({ senses: [{ gloss: "to become", tags: [] }] })],
        });

      renderSearch();
      const user = await search("стол");

      await user.clear(field());
      await search("стать");
      expect(await screen.findByText("to become")).toBeInTheDocument();

      await act(async () => {
        resolveFirst({
          query: "стол",
          entries: [entry({ senses: [{ gloss: "table", tags: [] }] })],
        });
      });

      expect(screen.queryByText("table")).not.toBeInTheDocument();
      expect(screen.getByText("to become")).toBeInTheDocument();
    });
  });
});
