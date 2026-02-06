/* eslint-disable testing-library/no-node-access */
import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LanguageSelector } from "@/components/auth/language-selector";
import { allLanguages } from "@/types/languages";

const mockPush = jest.fn();
const mockSaveProfile = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
      prefetch: () => null,
    };
  },
}));

jest.mock("@/lib/profile", () => ({
  saveProfile: (...args: unknown[]) => mockSaveProfile(...args),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// NOTE: Throughout this test suite, a common theme is that getByText does not work well with English,
// because the language.name === language.nativeName and the selector returns multiple result.
// Workarounds include simply querying for other languages (often German) or using getAllByText()[0].

describe("LanguageSelector", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveProfile.mockResolvedValue(undefined);
  });

  describe("Step 1 - Source Language Selection", () => {
    it("should render the source language selection step initially", () => {
      render(<LanguageSelector />);

      expect(
        screen.getByText("What is your native language?"),
      ).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    });

    it("should display all available languages", () => {
      render(<LanguageSelector />);

      allLanguages.forEach((language) => {
        expect(screen.getAllByText(language.name)).not.toHaveLength(0);
        expect(screen.getAllByText(language.nativeName)).not.toHaveLength(0);
      });
    });

    it("should have the continue button disabled when no language is selected", () => {
      render(<LanguageSelector />);

      const continueButton = screen.getByRole("button", { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });

    it("should enable the continue button when a language is selected", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getAllByText("English")[0]);

      const continueButton = screen.getByRole("button", { name: /continue/i });
      expect(continueButton).toBeEnabled();
    });

    it("should pre-select source language from profile if provided", () => {
      const profile = {
        id: "some-user-id",
        source_language: "de" as const,
        target_language: "ru" as const,
        created_at: "2024-01-01T00:00:00Z",
      };

      render(<LanguageSelector profile={profile} />);

      // The German language card should have the selected styling
      const germanButton = screen.getByText("German").closest("button");
      expect(germanButton).toHaveClass("border-primary");
    });
  });

  describe("Step 2 - Target Language Selection", () => {
    it("should navigate to step 2 when continue is clicked", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByText("German"));
      await user.click(screen.getByRole("button", { name: /continue/i }));

      expect(
        screen.getByText("Which language are you learning?"),
      ).toBeInTheDocument();
      expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    });

    it("should not show the selected source language in target options", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByText("German"));
      await user.click(screen.getByRole("button", { name: /continue/i }));

      // English should not be visible on step 2
      expect(screen.queryByText("German")).not.toBeInTheDocument();
      // Other languages should still be visible
      expect(screen.getByText("Russian")).toBeInTheDocument();
      expect(screen.getByText("French")).toBeInTheDocument();
    });

    it("should go back to step 1 when back button is clicked", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByText("German"));
      await user.click(screen.getByRole("button", { name: /continue/i }));
      await user.click(screen.getByRole("button", { name: /back/i }));

      expect(
        screen.getByText("What is your native language?"),
      ).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    });

    it("should preserve source language selection when going back", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByText("German"));
      await user.click(screen.getByRole("button", { name: /continue/i }));
      await user.click(screen.getByRole("button", { name: /back/i }));

      const germanButton = screen.getByText("German").closest("button");
      expect(germanButton).toHaveClass("border-primary");
    });

    it("should have the continue button disabled when no target language is selected", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByText("German"));
      await user.click(screen.getByRole("button", { name: /continue/i }));

      // The continue button on step 2 should be disabled
      const buttons = screen.getAllByRole("button", { name: /continue/i });
      const continueButton = buttons.find(
        (b) => !b.textContent?.includes("Back"),
      );
      expect(continueButton).toBeDisabled();
    });

    it("should pre-select target language from profile if provided", async () => {
      const user = userEvent.setup();
      const profile = {
        id: "some-user-id",
        source_language: "en" as const,
        target_language: "ru" as const,
        created_at: "2024-01-01T00:00:00Z",
      };

      render(<LanguageSelector profile={profile} />);

      // Navigate to step 2
      await user.click(screen.getByRole("button", { name: /continue/i }));

      // Russian should be pre-selected
      const russianButton = screen.getByText("Russian").closest("button");
      expect(russianButton).toHaveClass("border-primary");
    });
  });

  describe("Saving languages", () => {
    it("should save languages and redirect to dashboard on success", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByText("German"));
      await user.click(screen.getByRole("button", { name: /continue/i }));
      await user.click(screen.getByText("Russian"));
      await user.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => {
        expect(mockSaveProfile).toHaveBeenCalledWith("de", "ru");
      });

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should display an error message on save failure", async () => {
      mockSaveProfile.mockRejectedValueOnce(new Error("Database error"));

      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByText("German"));
      await user.click(screen.getByRole("button", { name: /continue/i }));
      await user.click(screen.getByText("Russian"));
      await user.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to save language selection"),
        ).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should show loading state while saving", async () => {
      // Make the saveProfile take some time
      mockSaveProfile.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(undefined), 100)),
      );

      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByText("German"));
      await user.click(screen.getByRole("button", { name: /continue/i }));
      await user.click(screen.getByText("Russian"));
      await user.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.getByText("Saving...")).toBeInTheDocument();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });
  });
});
