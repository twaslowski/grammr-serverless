import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CyrillicTransliterator } from "@/components/tools/cyrillic-transliterator";

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe("CyrillicTransliterator", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
  });

  it("should render the component with default state", () => {
    render(<CyrillicTransliterator />);

    expect(screen.getByText("Cyrillic Transliterator")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Convert between Latin and Cyrillic script for Russian text",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Latin input")).toBeInTheDocument();
    expect(screen.getByText("Cyrillic output")).toBeInTheDocument();
  });

  it("should transliterate Latin to Cyrillic by default", async () => {
    const user = userEvent.setup();
    render(<CyrillicTransliterator />);

    const input = screen.getByPlaceholderText(
      "Type in Latin script (e.g., 'privet')",
    );
    await user.type(input, "privet");

    // The output should contain the Cyrillic transliteration
    const output = screen.getByPlaceholderText("Результат появится здесь");
    expect(output).toHaveValue("привет");
  });

  it("should transliterate Cyrillic to Latin when direction is switched", async () => {
    const user = userEvent.setup();
    render(<CyrillicTransliterator />);

    // Click the direction toggle button
    const toggleButton = screen.getByTitle("Switch direction");
    await user.click(toggleButton);

    // Labels should change
    expect(screen.getByText("Cyrillic input")).toBeInTheDocument();
    expect(screen.getByText("Latin output")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Введите текст на русском");
    await user.type(input, "привет");

    const output = screen.getByPlaceholderText("Result will appear here");
    expect(output).toHaveValue("privet");
  });

  it("should swap input and output when toggling direction", async () => {
    const user = userEvent.setup();
    render(<CyrillicTransliterator />);

    // Type some Latin text
    const input = screen.getByPlaceholderText(
      "Type in Latin script (e.g., 'privet')",
    );
    await user.type(input, "privet");

    // Toggle direction - should swap input with output
    const toggleButton = screen.getByTitle("Switch direction");
    await user.click(toggleButton);

    // The new input should now have the Cyrillic text
    const newInput = screen.getByPlaceholderText("Введите текст на русском");
    expect(newInput).toHaveValue("привет");
  });

  it("should not show copy button when output is empty", () => {
    render(<CyrillicTransliterator />);

    expect(screen.queryByTitle("Copy to clipboard")).not.toBeInTheDocument();
  });

  it("should handle empty or whitespace input", async () => {
    const user = userEvent.setup();
    render(<CyrillicTransliterator />);

    const input = screen.getByPlaceholderText(
      "Type in Latin script (e.g., 'privet')",
    );
    await user.type(input, "   ");

    const output = screen.getByPlaceholderText("Результат появится здесь");
    expect(output).toHaveValue("");
  });
});
