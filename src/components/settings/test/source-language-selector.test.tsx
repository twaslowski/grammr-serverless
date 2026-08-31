import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SourceLanguageSelector } from "@/components/settings/source-language-selector";
import { allLanguages } from "@/types/languages";
import { Profile } from "@/types/profile";

const mockSaveProfile = jest.fn();

jest.mock("@/lib/profile", () => ({
  saveProfile: (...args: unknown[]) => mockSaveProfile(...args),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const profile: Profile = {
  id: "user-1",
  sourceLanguage: "en",
  targetLanguage: "ru",
  createdAt: null,
};

describe("SourceLanguageSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveProfile.mockResolvedValue(undefined);
  });

  it("offers every language as a native language", () => {
    render(<SourceLanguageSelector profile={profile} />);

    // `name` and `nativeName` coincide for English, hence getAllByText.
    allLanguages.forEach((language) => {
      expect(screen.getAllByText(language.name)).not.toHaveLength(0);
    });
  });

  it("does not offer a target language choice", () => {
    render(<SourceLanguageSelector profile={profile} />);

    expect(
      screen.queryByText(/which language are you learning/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/step 1 of 2/i)).not.toBeInTheDocument();
  });

  it("preselects the profile's current source language", () => {
    render(
      <SourceLanguageSelector profile={{ ...profile, sourceLanguage: "de" }} />,
    );

    expect(screen.getByRole("button", { name: /German/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  /**
   * The regression this guards: saving a new native language must not disturb
   * the target language, or a user changing "English" to "German" would also
   * re-language every deck they own.
   */
  it("saves the new source language and preserves the target", async () => {
    const user = userEvent.setup();
    render(<SourceLanguageSelector profile={profile} />);

    await user.click(screen.getByRole("button", { name: /German/ }));
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(mockSaveProfile).toHaveBeenCalledWith("de", "ru"),
    );
  });

  it("surfaces a failure to save", async () => {
    mockSaveProfile.mockRejectedValue(new Error("nope"));
    const user = userEvent.setup();
    render(<SourceLanguageSelector profile={profile} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText("Failed to save language selection"),
    ).toBeInTheDocument();
  });
});
