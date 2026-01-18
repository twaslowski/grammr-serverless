import { UpdateFlashcardDialog } from "@/components/flashcard/update-flashcard-dialog";
import { screen, render } from "@testing-library/react";
import { flashcardFixture } from "./flashcard.fixture";
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
    render(<UpdateFlashcardDialog flashcard={flashcardFixture} />);

    await userEvent.click(
      screen.getByRole("button", {
        name: `edit-flashcard-${flashcardFixture.id}`,
      }),
    );

    expect(screen.getByLabelText("Front (Word/Phrase)")).toHaveValue(
      flashcardFixture.front,
    );
    expect(screen.getByLabelText("Translation")).toHaveValue(
      flashcardFixture.back.translation,
    );
    expect(screen.getByLabelText("Notes (optional)")).toHaveValue(
      flashcardFixture.notes,
    );
  });
});
