import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import { DictionaryEntry } from "@/types/dictionary";
import { DictionaryEntryCard } from "../dictionary-entry";

// The flashcard and TTS controls drag in auth and audio concerns that have
// nothing to do with what is being asserted here.
jest.mock("@/components/flashcard", () => ({
  CreateFlashcardDialog: () => null,
}));
jest.mock("@/components/tts/tts-button", () => ({
  TTSButton: () => null,
}));

const renderEntry = (entry: DictionaryEntry) =>
  render(<DictionaryEntryCard entry={entry} languageCode="ru" />);

const headword = () => screen.getByRole("heading", { level: 2 });

const noun: DictionaryEntry = {
  lemma: "стол",
  accented: "сто́л",
  partOfSpeech: "NOUN",
  lemmaFeatures: [
    { type: "GENDER", value: "MASC" },
    { type: "ANIMACY", value: "INAN" },
  ],
  senses: [
    { gloss: "table (piece of furniture)", tags: [] },
    { gloss: "board, diet", tags: ["figurative"] },
  ],
  inflections: [
    {
      lemma: "стол",
      inflected: "стол",
      features: [
        { type: "CASE", value: "NOM" },
        { type: "NUMBER", value: "SING" },
      ],
    },
    {
      lemma: "стол",
      inflected: "стола",
      features: [
        { type: "CASE", value: "GEN" },
        { type: "NUMBER", value: "SING" },
      ],
    },
  ],
  source: "wiktionary",
  sourceUrl: "https://en.wiktionary.org/wiki/table#Russian",
};

const adverb: DictionaryEntry = {
  lemma: "быстро",
  accented: "бы́стро",
  partOfSpeech: "ADV",
  lemmaFeatures: [],
  senses: [{ gloss: "quickly, fast", tags: [] }],
  inflections: null,
  source: "wiktionary",
  sourceUrl: "https://en.wiktionary.org/wiki/quickly#Russian",
};

describe("DictionaryEntryCard", () => {
  describe("headword", () => {
    it("shows the stressed spelling, which is the reading aid", () => {
      renderEntry(noun);
      expect(headword()).toHaveTextContent("сто́л");
    });

    it("falls back to the plain form when there is no stressed spelling", () => {
      // Queried as a heading rather than by text: the plain form also appears as
      // the nominative singular cell, which is correct and not what is under test.
      renderEntry({ ...noun, accented: undefined });
      expect(headword()).toHaveTextContent("стол");
    });

    it("labels the part of speech and the inherent features", () => {
      renderEntry(noun);
      expect(screen.getByText("Noun")).toBeInTheDocument();
      expect(screen.getByText("Masculine")).toBeInTheDocument();
      expect(screen.getByText("Inanimate")).toBeInTheDocument();
    });
  });

  describe("senses", () => {
    it("numbers the definitions", () => {
      renderEntry(noun);
      expect(
        screen.getByText("table (piece of furniture)"),
      ).toBeInTheDocument();
      expect(screen.getByText("board, diet")).toBeInTheDocument();
      expect(screen.getByText("1.")).toBeInTheDocument();
      expect(screen.getByText("2.")).toBeInTheDocument();
    });

    it("shows sense tags alongside the gloss", () => {
      renderEntry(noun);
      expect(screen.getByText("figurative")).toBeInTheDocument();
    });

    it("says so when there is no definition, rather than leaving a gap", () => {
      // Happens for entries the generators produced: they yield forms, not
      // meanings.
      renderEntry({
        ...noun,
        senses: [],
        source: "generated",
        sourceUrl: null,
      });
      expect(
        screen.getByText(/No definition available for this word yet/),
      ).toBeInTheDocument();
    });
  });

  describe("the inflection table", () => {
    it("is rendered for a word that inflects", () => {
      renderEntry(noun);
      expect(screen.getByText("Nominative")).toBeInTheDocument();
      expect(screen.getByText("стола")).toBeInTheDocument();
    });

    it("does not duplicate the headword, because the card supplies its own", () => {
      renderEntry(noun);
      // The table is asked not to draw a header; one heading is what proves it.
      expect(screen.getAllByRole("heading")).toHaveLength(1);
    });

    it("is replaced by an explanation for a word that does not inflect", () => {
      renderEntry(adverb);
      expect(screen.getByText(/Adverbs do not inflect/)).toBeInTheDocument();
      expect(screen.queryByText("Nominative")).not.toBeInTheDocument();
    });

    it("says indeclinable when the word is, rather than just uninflected", () => {
      renderEntry({
        ...noun,
        lemma: "кофе",
        accented: undefined,
        inflections: null,
        lemmaFeatures: [
          { type: "GENDER", value: "MASC" },
          { type: "OTHER", value: "INDECLINABLE" },
        ],
      });
      expect(screen.getByText(/indeclinable/)).toBeInTheDocument();
    });

    it("is suppressed for a part of speech with no table layout", () => {
      // Otherwise InflectionsTable renders its "not available for this part of
      // speech" fallback, which is the old error message in a new place.
      renderEntry({
        ...noun,
        partOfSpeech: "PART",
        lemmaFeatures: [],
      });
      expect(
        screen.queryByText(/Inflection table not available/),
      ).not.toBeInTheDocument();
    });
  });

  describe("attribution", () => {
    it("links a Wiktionary entry back to its source under CC BY-SA", () => {
      renderEntry(noun);
      const link = screen.getByRole("link", { name: "Wiktionary" });
      expect(link).toHaveAttribute("href", noun.sourceUrl);
      expect(
        screen.getByRole("link", { name: "CC BY-SA 4.0" }),
      ).toBeInTheDocument();
    });

    it("is omitted for a generated entry, which carries no such obligation", () => {
      renderEntry({ ...noun, source: "generated", sourceUrl: null });
      expect(
        screen.queryByRole("link", { name: "Wiktionary" }),
      ).not.toBeInTheDocument();
    });
  });
});
