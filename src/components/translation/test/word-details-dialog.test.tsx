/* eslint-disable testing-library/no-node-access */
import { TokenMorphology, TokenMorphologySchema } from "@/types/morphology";
import { screen, render, waitFor } from "@testing-library/react";
import { WordDetailsDialog } from "@/components/translation/word-details-dialog";
import "@testing-library/jest-dom";
import { FALLBACK_FEATURE_TYPE } from "@/types/feature";
import userEvent from "@testing-library/user-event";

// Mock the profile provider
jest.mock("@/components/dashboard/profile-provider", () => ({
  useProfile: () => ({
    source_language: "ru",
    target_language: "en",
  }),
}));

// Mock the inflections API call
jest.mock("@/lib/inflections", () => ({
  getInflections: jest.fn(),
}));

// Mock the flashcards API call
jest.mock("@/lib/flashcards", () => ({
  createFlashcard: jest.fn(),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("WordDetailsDialog", () => {
  it("should render feature labels correctly when dialog is opened", async () => {
    const morphology: TokenMorphology = {
      text: "ran",
      lemma: "run",
      pos: "VERB",
      features: [
        { type: "TENSE", value: "Past" },
        { type: "NUMBER", value: "Singular" },
      ],
    };

    const user = userEvent.setup();

    render(
      <WordDetailsDialog
        word="ran"
        translation="lief"
        morphology={morphology}
        isLoading={false}
      />,
    );

    // Click the trigger button
    const triggerButton = screen.getByRole("button");
    await user.click(triggerButton);

    // Wait for dialog to open and check content
    await waitFor(() => {
      expect(screen.getByText("Word Details: ran")).toBeInTheDocument();
    });

    expect(screen.getByText("Verb")).toBeInTheDocument();

    // Features are rendered with human-readable labels
    const numberFeature = screen.getByText(/Number/).closest("div");
    expect(numberFeature).toHaveTextContent(/Number\s*:\s*Singular/i);

    const tenseFeature = screen.getByText(/Tense/).closest("div");
    expect(tenseFeature).toHaveTextContent(/Tense\s*:\s*Past/i);
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

  it("should disregard ignored features when rendering", async () => {
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

    const user = userEvent.setup();

    render(
      <WordDetailsDialog
        word="ran"
        translation="lief"
        morphology={morphology}
        isLoading={false}
      />,
    );

    // Click the trigger button
    const triggerButton = screen.getByRole("button");
    await user.click(triggerButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText("Word Details: ran")).toBeInTheDocument();
    });

    expect(screen.getByText("Verb")).toBeInTheDocument();

    // Features are rendered with human-readable labels
    const numberFeature = screen.getByText(/Number/).closest("div");
    expect(numberFeature).toHaveTextContent(/Number\s*:\s*Singular/i);

    expect(screen.queryByText(/IGNORED/)).not.toBeInTheDocument();
  });

  it("should be disabled when loading", () => {
    render(
      <WordDetailsDialog
        word="test"
        translation={null}
        morphology={null}
        isLoading={true}
      />,
    );

    const triggerButton = screen.getByRole("button");
    expect(triggerButton).toBeDisabled();
  });

  it("should be disabled when data is not available", () => {
    render(
      <WordDetailsDialog
        word="test"
        translation={null}
        morphology={null}
        isLoading={false}
      />,
    );

    const triggerButton = screen.getByRole("button");
    expect(triggerButton).toBeDisabled();
  });

  it("should be enabled when data is available", () => {
    const morphology: TokenMorphology = {
      text: "test",
      lemma: "test",
      pos: "NOUN",
      features: [],
    };

    render(
      <WordDetailsDialog
        word="test"
        translation="test translation"
        morphology={morphology}
        isLoading={false}
      />,
    );

    const triggerButton = screen.getByRole("button");
    expect(triggerButton).toBeEnabled();
  });
});
