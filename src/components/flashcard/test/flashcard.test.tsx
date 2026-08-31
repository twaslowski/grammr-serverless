import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Flashcard } from "@/components/flashcard/flashcard";
import { FlashcardWithDeck } from "@/types/flashcards";

import {
  analysisFlashcardFixture,
  simpleFlashcardFixture,
  wordFlashcardFixture,
} from "./flashcard.fixture";

jest.mock("@/components/flashcard/update-flashcard-dialog", () => ({
  UpdateFlashcardDialog: () => null,
}));
jest.mock("@/components/translation/word-details-dialog", () => ({
  WordDetailsDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

const withDeck = (card: typeof simpleFlashcardFixture): FlashcardWithDeck => ({
  ...card,
  deck: { id: 1, name: "Default", userId: "user-1" },
});

const renderCard = (card: typeof simpleFlashcardFixture) =>
  render(
    <Flashcard
      flashcard={withDeck(card)}
      isOwner
      onDelete={jest.fn()}
      onUpdate={jest.fn()}
    />,
  );

describe("Flashcard", () => {
  /**
   * The inconsistency this replaces: only `word` cards got a "View
   * Inflections" button, so an `analysis` card's per-token breakdown was
   * unreachable from the list even though it was right there in the data.
   */
  it("offers the same disclosure for a paradigm card and an analysis card", async () => {
    const user = userEvent.setup();

    const { unmount } = renderCard(wordFlashcardFixture);
    const forms = screen.getByRole("button", { name: /Forms \(2\)/ });
    expect(forms).toHaveAttribute("aria-expanded", "false");
    await user.click(forms);
    expect(forms).toHaveAttribute("aria-expanded", "true");
    unmount();

    renderCard(analysisFlashcardFixture);
    const breakdown = screen.getByRole("button", { name: /Breakdown \(2\)/ });
    expect(breakdown).toHaveAttribute("aria-expanded", "false");
    await user.click(breakdown);
    expect(breakdown).toHaveAttribute("aria-expanded", "true");
  });

  it("renders no disclosure for a phrase card, which has nothing behind it", () => {
    renderCard(simpleFlashcardFixture);

    expect(
      screen.queryByRole("button", { name: /Forms|Breakdown/ }),
    ).not.toBeInTheDocument();
  });

  it("no longer shows the old paradigm-only button", () => {
    renderCard(wordFlashcardFixture);

    expect(
      screen.queryByRole("button", { name: /View Inflections/i }),
    ).not.toBeInTheDocument();
  });

  /**
   * The table is not cheap and a page holds twenty-five of these, so it must
   * not be mounted merely because the card is on screen.
   */
  it("keeps the detail unmounted until it is asked for", async () => {
    const user = userEvent.setup();
    renderCard(wordFlashcardFixture);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Forms/ }));

    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("hides the owner controls on someone else's card", () => {
    render(
      <Flashcard
        flashcard={withDeck(wordFlashcardFixture)}
        isOwner={false}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Delete flashcard/i }),
    ).not.toBeInTheDocument();
    // The detail is still reachable; it is not an owner-only affordance.
    expect(screen.getByRole("button", { name: /Forms/ })).toBeInTheDocument();
  });
});
