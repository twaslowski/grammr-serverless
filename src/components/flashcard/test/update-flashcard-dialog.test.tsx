import { UpdateFlashcardDialog } from "@/components/flashcard/update-flashcard-dialog";
import { screen, render } from "@testing-library/react";
import { simpleFlashcardFixture } from "./flashcard.fixture";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: () => null,
    };
  },
}));

describe("update flashcard dialog", () => {
  it("should display initial values properly", async () => {
    render(<UpdateFlashcardDialog flashcard={simpleFlashcardFixture} />);

    await userEvent.click(
      screen.getByRole("button", {
        name: `edit-flashcard-${simpleFlashcardFixture.id}`,
      }),
    );

    expect(screen.getByLabelText("Front (Word/Phrase)")).toHaveValue(
      simpleFlashcardFixture.front,
    );
    expect(screen.getByLabelText("Translation")).toHaveValue(
      simpleFlashcardFixture.back.translation,
    );
    expect(screen.getByLabelText("Notes (optional)")).toHaveValue(
      simpleFlashcardFixture.notes,
    );
  });
});
