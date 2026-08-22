import "@testing-library/jest-dom";

import React from "react";
import { render, screen, within } from "@testing-library/react";

import { Inflection, Paradigm } from "@/types/inflections";
import { InflectionsTable } from "../inflections-table";

// The header's flashcard and TTS controls pull in auth and audio concerns that
// are irrelevant here; every test renders the table without them.
const renderTable = (paradigm: Paradigm) =>
  render(
    <InflectionsTable
      paradigm={paradigm}
      displayAddFlashcard={false}
      displayTTSButton={false}
    />,
  );

const nounCell = (
  inflected: string,
  caseValue: string,
  number: string,
): Inflection => ({
  lemma: "кот",
  inflected,
  features: [
    { type: "CASE", value: caseValue },
    { type: "NUMBER", value: number },
  ],
});

const adjectiveCell = (
  inflected: string,
  caseValue: string,
  number: string,
  gender?: string,
): Inflection => ({
  lemma: "новый",
  inflected,
  features: [
    { type: "CASE", value: caseValue },
    { type: "NUMBER", value: number },
    ...(gender ? [{ type: "GENDER" as const, value: gender }] : []),
  ],
});

describe("InflectionsTable", () => {
  describe("nouns", () => {
    const noun: Paradigm = {
      partOfSpeech: "NOUN",
      lemma: "кот",
      lemmaFeatures: [{ type: "GENDER", value: "MASC" }],
      inflections: [
        nounCell("кот", "NOM", "SING"),
        nounCell("коты", "NOM", "PLUR"),
      ],
    };

    it("shows the inherent gender alongside the part of speech", () => {
      renderTable(noun);

      expect(screen.getByText("Noun · Masculine")).toBeInTheDocument();
    });

    it("keeps the case/number layout", () => {
      renderTable(noun);

      expect(screen.getByText("Singular")).toBeInTheDocument();
      expect(screen.getByText("Plural")).toBeInTheDocument();
      expect(screen.queryByText("Feminine")).not.toBeInTheDocument();
    });

    it("omits gender when the lexeme has none", () => {
      renderTable({ ...noun, lemma: "ножницы", lemmaFeatures: [] });

      expect(screen.getByText("Noun")).toBeInTheDocument();
    });
  });

  describe("adjectives", () => {
    const adjective: Paradigm = {
      partOfSpeech: "ADJ",
      lemma: "новый",
      lemmaFeatures: [],
      inflections: [
        adjectiveCell("новый", "NOM", "SING", "MASC"),
        adjectiveCell("новая", "NOM", "SING", "FEM"),
        adjectiveCell("новое", "NOM", "SING", "NEUT"),
        adjectiveCell("новые", "NOM", "PLUR"),
      ],
    };

    it("renders a column per gender plus a genderless plural", () => {
      renderTable(adjective);

      expect(screen.getByText("Masculine")).toBeInTheDocument();
      expect(screen.getByText("Feminine")).toBeInTheDocument();
      expect(screen.getByText("Neuter")).toBeInTheDocument();
      expect(screen.getByText("Plural")).toBeInTheDocument();
      expect(screen.queryByText("Singular")).not.toBeInTheDocument();
    });

    it("places each gendered form in its own column", () => {
      renderTable(adjective);

      const row = screen
        .getAllByRole("row")
        .find((candidate) => within(candidate).queryByText("Nominative"));
      const cells = within(row as HTMLElement).getAllByRole("cell");

      expect(cells.map((cell) => cell.textContent)).toEqual([
        "Nominative",
        "новый",
        "новая",
        "новое",
        "новые",
      ]);
    });

    it("does not claim a gender for the lexeme itself", () => {
      renderTable(adjective);

      expect(screen.getByText("Adjective")).toBeInTheDocument();
    });

    it("falls back to the case/number layout for paradigms without gendered forms", () => {
      renderTable({
        ...adjective,
        inflections: [
          adjectiveCell("новый", "NOM", "SING"),
          adjectiveCell("новые", "NOM", "PLUR"),
        ],
      });

      expect(screen.getByText("Singular")).toBeInTheDocument();
      expect(screen.queryByText("Masculine")).not.toBeInTheDocument();
    });
  });

  describe("verbs", () => {
    it("is unaffected by lemma features", () => {
      renderTable({
        partOfSpeech: "VERB",
        lemma: "идти",
        lemmaFeatures: [],
        inflections: [
          {
            lemma: "идти",
            inflected: "иду",
            features: [
              { type: "PERSON", value: "FIRST" },
              { type: "NUMBER", value: "SING" },
            ],
          },
        ],
      });

      expect(screen.getByText("Verb")).toBeInTheDocument();
      expect(screen.getByText("1st Person")).toBeInTheDocument();
      expect(screen.getByText("иду")).toBeInTheDocument();
    });
  });
});
