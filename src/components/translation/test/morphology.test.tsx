import { TokenMorphology, TokenMorphologySchema } from "@/types/morphology";
import { screen, render } from "@testing-library/react";
import { Morphology } from "@/components/translation/morphology";
import "@testing-library/jest-dom";
import { FALLBACK_FEATURE_TYPE } from "@/types/feature";

describe("morphology", () => {
  it("should render feature labels correctly", () => {
    const morphology: TokenMorphology = {
      text: "ran",
      lemma: "run",
      pos: "VERB",
      features: [
        { type: "TENSE", value: "Past" },
        { type: "NUMBER", value: "Singular" },
      ],
    };

    render(
      <Morphology word="ran" translation="lief" morphology={morphology} />,
    );

    expect(screen.getByText("VERB")).toBeInTheDocument();

    const number = screen.getByText(/NUMBER/);
    expect(number).toHaveTextContent(/NUMBER\s*:\s*Singular/i);

    const tense = screen.getByText(/TENSE/);
    expect(tense).toHaveTextContent(/TENSE\s*:\s*Past/i);
  });

  it("should disregard ignored features when parsing", () => {
    const morphology = TokenMorphologySchema.parse({
      text: "ran",
      lemma: "run",
      pos: "VERB",
      features: [
        { type: "TENSE", value: "Past" },
        { type: "NUMBER", value: "Singular" },
        { type: "IGNORED", value: "ignored" },
      ],
    });

    const filteredFeatures = morphology.features.filter(
      (f) => f.type !== FALLBACK_FEATURE_TYPE,
    );
    expect(filteredFeatures).toHaveLength(2);
    expect(filteredFeatures).toEqual(
      expect.arrayContaining([
        { type: "TENSE", value: "Past" },
        { type: "NUMBER", value: "Singular" },
      ]),
    );
  });

  it("should be case insensitive when parsing", () => {
    const morphology = TokenMorphologySchema.parse({
      text: "ran",
      lemma: "run",
      pos: "VERB",
      features: [{ type: "tense", value: "Past" }],
    });

    expect(morphology.features).toHaveLength(1);
    expect(morphology.features).toEqual(
      expect.arrayContaining([{ type: "TENSE", value: "Past" }]),
    );
  });

  it("should disregard ignored features when rendering", () => {
    const morphology = TokenMorphologySchema.parse({
      text: "ran",
      lemma: "run",
      pos: "VERB",
      features: [
        { type: "TENSE", value: "Past" },
        { type: "NUMBER", value: "Singular" },
        { type: "IGNORED", value: "ignored" },
      ],
    });

    render(
      <Morphology word="ran" translation="lief" morphology={morphology} />,
    );

    expect(screen.getByText("VERB")).toBeInTheDocument();

    const number = screen.getByText(/NUMBER/);
    expect(number).toHaveTextContent(/NUMBER\s*:\s*Singular/i);

    expect(screen.queryByText(/IGNORED/)).not.toBeInTheDocument();
  });
});
