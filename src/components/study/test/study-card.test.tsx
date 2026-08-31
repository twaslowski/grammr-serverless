import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StudyCard } from "@/components/study/study-card";
import { FlashcardBack } from "@/types/flashcards";
import { CardWithFlashcard } from "@/types/fsrs";

jest.mock("@/components/tts/tts-button", () => ({ TTSButton: () => null }));
jest.mock("@/components/translation/word-details-dialog", () => ({
  WordDetailsDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

const wordBack: FlashcardBack = {
  type: "word",
  translation: "table",
  paradigm: {
    partOfSpeech: "NOUN",
    lemma: "стол",
    lemmaFeatures: [],
    inflections: [
      { lemma: "стол", inflected: "стола", features: [] },
      { lemma: "стол", inflected: "столу", features: [] },
    ],
  },
};

const analysisBack: FlashcardBack = {
  type: "analysis",
  translation: "I am reading",
  text: "я читаю",
  language: "ru",
  tokens: [
    { text: "я", lemma: "я", pos: "PRON", features: [] },
    { text: "читаю", lemma: "читать", pos: "VERB", features: [] },
  ],
};

const phraseBack: FlashcardBack = { type: "phrase", translation: "hello" };

const card = (back: FlashcardBack): CardWithFlashcard => ({
  id: 1,
  flashcardId: 1,
  deckId: 1,
  userId: "123e4567-e89b-12d3-a456-426614174000",
  due: new Date("2026-01-01T00:00:00.000Z"),
  stability: 1,
  difficulty: 1,
  elapsedDays: 0,
  scheduledDays: 1,
  learningSteps: 0,
  reps: 3,
  lapses: 0,
  state: "Review",
  lastReview: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  flashcard: {
    id: 1,
    front: "стол",
    back,
    notes: null,
    language: "ru",
  },
});

const renderCard = (back: FlashcardBack) =>
  render(
    <StudyCard
      card={card(back)}
      schedulingOptions={[]}
      onReview={jest.fn()}
      isSubmitting={false}
    />,
  );

/** Reveals the answer, which is where any further detail lives. */
async function flip(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Show Answer/i }));
}

describe("StudyCard", () => {
  /**
   * The regression this locks down: the lemma used to *be* the dialog trigger,
   * with nothing on screen to say so. Discoverable only by clicking the text
   * and finding out.
   */
  it("does not make the lemma a hidden trigger", async () => {
    const user = userEvent.setup();
    renderCard(wordBack);
    await flip(user);

    // Present as text, but not as anything clickable.
    expect(screen.getByText("стол")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "стол" }),
    ).not.toBeInTheDocument();
  });

  it("offers the same disclosure as the card list, for both detailed types", async () => {
    const user = userEvent.setup();

    const { unmount } = renderCard(wordBack);
    await flip(user);
    expect(
      screen.getByRole("button", { name: /Forms \(2\)/ }),
    ).toBeInTheDocument();
    unmount();

    renderCard(analysisBack);
    await flip(user);
    expect(
      screen.getByRole("button", { name: /Breakdown \(2\)/ }),
    ).toBeInTheDocument();
  });

  it("shows no disclosure for a phrase card", async () => {
    const user = userEvent.setup();
    renderCard(phraseBack);
    await flip(user);

    expect(
      screen.queryByRole("button", { name: /Forms|Breakdown/ }),
    ).not.toBeInTheDocument();
  });

  /** Nothing beyond the prompt is offered before the reader has answered. */
  it("hides the detail until the card is flipped", () => {
    renderCard(wordBack);

    expect(
      screen.queryByRole("button", { name: /Forms/ }),
    ).not.toBeInTheDocument();
  });

  it("expands the forms in place", async () => {
    const user = userEvent.setup();
    renderCard(wordBack);
    await flip(user);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Forms/ }));
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
