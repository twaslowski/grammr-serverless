import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TranslitToggle } from "@/components/translit/translit-toggle";
import { useTranslit } from "@/components/translit/use-translit";

/** A field wired up the way the real inputs are. */
function Field({ label }: { label: string }) {
  const { enabled, toggle, convert } = useTranslit();
  const [value, setValue] = React.useState("");

  return (
    <div>
      <input
        aria-label={label}
        value={value}
        onChange={(e) => setValue(convert(value, e.target.value))}
      />
      <TranslitToggle enabled={enabled} onToggle={toggle} />
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("useTranslit", () => {
  it("passes typing through untouched while off", async () => {
    const user = userEvent.setup();
    render(<Field label="search" />);

    await user.type(screen.getByLabelText("search"), "stol");

    expect(screen.getByLabelText("search")).toHaveValue("stol");
  });

  it("converts as you type once switched on", async () => {
    const user = userEvent.setup();
    render(<Field label="search" />);

    await user.click(screen.getByRole("button", { name: /Cyrillic/i }));
    await user.type(screen.getByLabelText("search"), "stol");

    expect(screen.getByLabelText("search")).toHaveValue("стол");
  });

  it("remembers the preference", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Field label="search" />);

    await user.click(screen.getByRole("button", { name: /Cyrillic/i }));
    unmount();

    render(<Field label="search" />);
    expect(screen.getByRole("button", { name: /Cyrillic/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  /**
   * Two inputs can be on screen at once, and a preference that applied to only
   * the one you toggled would be baffling.
   */
  it("keeps every field on the page in step", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Field label="first" />
        <Field label="second" />
      </>,
    );

    const [firstToggle, secondToggle] = screen.getAllByRole("button", {
      name: /Cyrillic/i,
    });
    await user.click(firstToggle);

    expect(secondToggle).toHaveAttribute("aria-pressed", "true");
  });

  it("survives storage being unavailable", async () => {
    const getItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });

    const user = userEvent.setup();
    render(<Field label="search" />);

    await user.click(screen.getByRole("button", { name: /Cyrillic/i }));

    expect(screen.getByRole("button", { name: /Cyrillic/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    getItem.mockRestore();
  });
});
