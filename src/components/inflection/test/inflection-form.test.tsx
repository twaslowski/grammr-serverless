import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import { getPosLabel } from "@/lib/feature-labels";
import { PartOfSpeech } from "@/types/inflections";
import { LanguageCode } from "@/types/languages";
import { InflectionForm } from "../inflection-form";

// Mock getInflections and getPosLabel
jest.mock("@/lib/inflections", () => ({
  getInflections: jest.fn(),
  InflectionError: class InflectionError extends Error {
    isUserError = true;
  },
}));
jest.mock("@/lib/feature-labels", () => ({
  getPosLabel: (pos: string) => `Label for ${pos}`,
}));

describe("InflectionForm", () => {
  const baseProps = {
    languageName: "Italian",
    languageCode: "it" as LanguageCode,
    availablePos: ["NOUN", "VERB"] as PartOfSpeech[],
  };

  it("renders part of speech labels if distinguishPos is true", () => {
    render(<InflectionForm {...baseProps} distinguishPos={true} />);
    // Should render all available part of speech buttons with correct labels
    baseProps.availablePos.forEach((pos) => {
      expect(screen.getByText(getPosLabel(pos)));
    });
  });

  it("does not render part of speech labels if distinguishPos is false", () => {
    render(<InflectionForm {...baseProps} distinguishPos={false} />);
    // Should not render the label for part of speech
    expect(screen.queryByText(/Part of Speech/i)).not.toBeInTheDocument();
    // Should not render any part of speech buttons
    baseProps.availablePos.forEach((pos) => {
      expect(screen.queryByText(getPosLabel(pos))).not.toBeInTheDocument();
    });
  });
});
