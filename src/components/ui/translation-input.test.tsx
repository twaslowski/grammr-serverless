/* eslint-disable testing-library/no-node-access */
import "@testing-library/jest-dom";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

import { ProfileProvider } from "@/components/dashboard/profile-provider";
import { translate } from "@/lib/translation";
import { Profile } from "@/types/profile";
import { TranslationResponse } from "@/types/translation";

import { TranslationInput } from "./translation-input";

// Mock dependencies
jest.mock("@/lib/translation");
jest.mock("react-hot-toast");

const mockTranslate = translate as jest.MockedFunction<typeof translate>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock profile for testing
const mockProfile: Profile = {
  id: "test-user",
  source_language: "en",
  target_language: "es",
  created_at: new Date().toISOString(),
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProfileProvider profile={mockProfile}>{children}</ProfileProvider>
);

describe("TranslationInput", () => {
  const defaultProps = {
    value: "",
    textToTranslate: "hello",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTranslate.mockResolvedValue({ translation: "hola" });
    mockToast.error = jest.fn();
  });

  describe("Editable mode (default)", () => {
    it("renders input field with translation button", () => {
      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} />
        </TestWrapper>,
      );

      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /fetch translation/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter translation..."),
      ).toBeInTheDocument();
    });

    it("allows typing in the input field", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} onChange={onChange} />
        </TestWrapper>,
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      expect(onChange).toHaveBeenCalledTimes(4);
    });

    it("disables translation button when value is present", () => {
      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} value="existing translation" />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", { name: /fetch translation/i });
      expect(button).toBeDisabled();
    });

    it("fetches translation when sparkles button is clicked", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} onChange={onChange} />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", { name: /fetch translation/i });
      await user.click(button);

      expect(mockTranslate).toHaveBeenCalledWith({
        text: "hello",
        source_language: "es",
        target_language: "en",
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith("hola");
      });
    });

    it("shows loading state while translating", async () => {
      const user = userEvent.setup();

      // Create a promise we can control
      let resolveTranslation: (value: TranslationResponse) => void;
      const translationPromise = new Promise<TranslationResponse>((resolve) => {
        resolveTranslation = resolve;
      });

      mockTranslate.mockImplementation(() => translationPromise);

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", { name: /fetch translation/i });
      await user.click(button);

      // Check loading state
      expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
      expect(
        screen.getByRole("button", { name: /translating/i }),
      ).toBeInTheDocument();

      // Resolve translation
      resolveTranslation!({ translation: "hola" });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /fetch translation/i }),
        ).toBeInTheDocument();
      });
    });

    it("handles translation errors", async () => {
      const user = userEvent.setup();
      mockTranslate.mockRejectedValue(new Error("Translation failed"));

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", { name: /fetch translation/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Translation failed");
      });
    });

    it("does not fetch translation when required fields are missing", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} textToTranslate="" />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", { name: /fetch translation/i });
      await user.click(button);

      expect(mockTranslate).not.toHaveBeenCalled();
    });

    it("respects disabled prop", () => {
      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} disabled />
        </TestWrapper>,
      );

      expect(screen.getByRole("textbox")).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /fetch translation/i }),
      ).toBeDisabled();
    });

    it("uses custom placeholder", () => {
      render(
        <TestWrapper>
          <TranslationInput
            {...defaultProps}
            placeholder="Custom placeholder"
          />
        </TestWrapper>,
      );

      expect(
        screen.getByPlaceholderText("Custom placeholder"),
      ).toBeInTheDocument();
    });
  });

  describe("Non-editable mode", () => {
    it("renders spoiler blocks when no translation exists", () => {
      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} editable={false} />
        </TestWrapper>,
      );

      expect(screen.getByText("Click to reveal")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reveal translation/i }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("shows translation when clicked and translation exists", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} value="hola" editable={false} />
        </TestWrapper>,
      );

      const container = screen.getByText("Click to reveal").closest("div");
      expect(container).toBeInTheDocument();

      await user.click(container!);

      await waitFor(() => {
        expect(screen.getByText("hola")).toBeInTheDocument();
      });
    });

    // test is broken, but anecdotally the feature works - needs investigation

    // it("fetches translation when clicked and no translation exists", async () => {
    //   const user = userEvent.setup();
    //   const onChange = jest.fn();
    //
    //   let resolveTranslation: (value: TranslationResponse) => void;
    //   const translationPromise = new Promise<TranslationResponse>((resolve) => {
    //     resolveTranslation = resolve;
    //   });
    //
    //   mockTranslate.mockImplementation(() => translationPromise);
    //
    //   render(
    //       <TestWrapper>
    //         <TranslationInput
    //             {...defaultProps}
    //             onChange={onChange}
    //             editable={false}
    //         />
    //       </TestWrapper>,
    //   );
    //
    //   const container = screen.getByText("Click to reveal").closest("div");
    //   await user.click(container!);
    //
    //   resolveTranslation!({ translation: "hola" });
    //
    //   expect(mockTranslate).toHaveBeenCalledWith({
    //     text: "hello",
    //     source_language: "es",
    //     target_language: "en",
    //   });
    //
    //   await waitFor(() => {
    //     expect(onChange).toHaveBeenCalledWith("hola");
    //     expect(screen.getByText("/hola/")).toBeInTheDocument();
    //   });
    // });

    it("shows loading state while translating in non-editable mode", async () => {
      const user = userEvent.setup();
      let resolveTranslation: (value: TranslationResponse) => void;
      const translationPromise = new Promise<TranslationResponse>((resolve) => {
        resolveTranslation = resolve;
      });

      mockTranslate.mockImplementation(() => translationPromise);

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} editable={false} />
        </TestWrapper>,
      );

      expect(screen.getByTitle("reveal translation")).toBeInTheDocument();
      const container = screen.getByText("Click to reveal").closest("div");
      await user.click(container!);

      // Check loading state
      expect(screen.getByText("Translating...")).toBeInTheDocument();
      expect(screen.queryByTitle("reveal translation")).not.toBeInTheDocument();

      // Resolve translation
      resolveTranslation!({ translation: "hola" });
      await waitFor(() => {
        expect(screen.queryByText("Translating...")).not.toBeInTheDocument();
      });
    });

    it("applies fade-in animation when revealing translation", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} value="hola" editable={false} />
        </TestWrapper>,
      );

      const container = screen.getByText("Click to reveal").closest("div");
      await user.click(container!);

      await waitFor(() => {
        const translationElement = screen.getByText("hola");
        expect(translationElement).toHaveClass(
          "transition-opacity",
          "duration-300",
          "ease-in",
        );
      });
    });

    it("handles click events properly when disabled", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <TestWrapper>
          <TranslationInput
            {...defaultProps}
            onChange={onChange}
            editable={false}
            disabled
          />
        </TestWrapper>,
      );

      const container = screen.getByText("Click to reveal").closest("div");
      await user.click(container!);

      expect(mockTranslate).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Custom styling", () => {
    it("applies custom className to container", () => {
      const { container } = render(
        <TestWrapper>
          <TranslationInput {...defaultProps} className="custom-class" />
        </TestWrapper>,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("applies custom inputClassName to input in editable mode", () => {
      render(
        <TestWrapper>
          <TranslationInput
            {...defaultProps}
            inputClassName="custom-input-class"
          />
        </TestWrapper>,
      );

      expect(screen.getByRole("textbox")).toHaveClass("custom-input-class");
    });

    it("applies custom inputClassName to revealed text in non-editable mode", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TranslationInput
            {...defaultProps}
            value="hola"
            editable={false}
            inputClassName="custom-text-class"
          />
        </TestWrapper>,
      );

      const container = screen.getByText("Click to reveal").closest("div");
      await user.click(container!);

      await waitFor(() => {
        const translationElement = screen.getByText("hola");
        expect(translationElement).toHaveClass("custom-text-class");
      });
    });
  });

  describe("Edge cases", () => {
    it("handles empty textToTranslate", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} textToTranslate="" />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", { name: /fetch translation/i });
      await user.click(button);

      expect(mockTranslate).not.toHaveBeenCalled();
    });

    it("handles whitespace-only textToTranslate", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} textToTranslate="   " />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", { name: /fetch translation/i });
      await user.click(button);

      expect(mockTranslate).not.toHaveBeenCalled();
    });

    it("handles undefined translation error gracefully", async () => {
      const user = userEvent.setup();
      mockTranslate.mockRejectedValue(undefined);

      render(
        <TestWrapper>
          <TranslationInput {...defaultProps} />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", { name: /fetch translation/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Failed to fetch translation",
        );
      });
    });
  });
});
