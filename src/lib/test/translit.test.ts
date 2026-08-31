import { convertTyped, latinToCyrillic } from "@/lib/translit";

describe("latinToCyrillic", () => {
  it("converts a Latin transcription", () => {
    expect(latinToCyrillic("stol")).toBe("стол");
    expect(latinToCyrillic("privet")).toBe("привет");
  });

  it("maps digraphs to a single letter", () => {
    expect(latinToCyrillic("shkola")).toBe("школа");
  });

  it("leaves an empty string alone", () => {
    expect(latinToCyrillic("")).toBe("");
  });
});

describe("convertTyped", () => {
  /**
   * The point of the append path: text already on screen must not be rewritten.
   * `ш` came from a `sh` that is no longer in the buffer, so re-converting the
   * whole value would turn it back into something else.
   */
  it("converts only the newly typed tail", () => {
    expect(convertTyped("шко", "шкоl")).toBe("школ");
  });

  it("builds a word up one keystroke at a time", () => {
    let value = "";
    for (const char of "stol") {
      value = convertTyped(value, value + char);
    }
    expect(value).toBe("стол");
  });

  it("leaves Cyrillic already in the field untouched when appending", () => {
    expect(convertTyped("стол", "столu")).toBe("столу");
  });

  it("re-converts the whole buffer on a deletion", () => {
    expect(convertTyped("стол", "сто")).toBe("сто");
  });

  it("re-converts the whole buffer on a mid-string edit", () => {
    expect(convertTyped("стол", "сtол")).toBe("стол");
  });

  it("handles a paste that replaces everything", () => {
    expect(convertTyped("стол", "privet")).toBe("привет");
  });

  /**
   * A digraph is only resolvable once its second character arrives. Showing the
   * intermediate `с` is the honest thing to do — the alternative is not showing
   * the reader what they typed.
   */
  it("shows the intermediate letter of a digraph", () => {
    expect(convertTyped("", "s")).toBe("с");
  });

  it("resolves a digraph once its second character arrives", () => {
    let value = convertTyped("", "z");
    expect(value).toBe("з");
    value = convertTyped(value, value + "h");
    expect(value).toBe("ж");
  });

  it("builds a word up one keystroke at a time through a digraph", () => {
    let value = "";
    for (const char of "zhaba") {
      value = convertTyped(value, value + char);
    }
    expect(value).toBe("жаба");
  });
});
