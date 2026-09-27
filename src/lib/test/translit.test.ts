import { convertTyped, latinToCyrillic, TRANSLIT_KEYS } from "@/lib/translit";

/** Types a word from scratch, the way the input actually calls the converter. */
function type(word: string): string {
  let value = "";
  for (const char of word) {
    value = convertTyped(value, value + char);
  }
  return value;
}

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
    expect(type("zhaba")).toBe("жаба");
  });

  /**
   * The soft sign has no Latin letter of its own, so the apostrophe has to
   * survive a keystroke landing after it — the re-opening step used to ask the
   * library to re-latinize `ь`, get the empty string back, and drop the letter.
   */
  it("keeps a soft sign when typing continues past it", () => {
    expect(type("den'ki")).toBe("деньки");
    expect(type("pis'mo")).toBe("письмо");
  });

  it("promotes a soft sign to a hard sign on a second apostrophe", () => {
    expect(type("s''")).toBe("съ");
    expect(type("pod''yezd")).toBe("подъезд");
  });

  /**
   * A sign starts a word as far as the converter is concerned, because that is
   * the position the letters after one are spelled for: `ye` is е there, where
   * mid-word it would be `ые`. The reader is not thinking in those terms, so
   * the mid-word spelling of е has to keep working after a sign too — and `e`
   * meaning э, which no sign is ever followed by, must not win.
   */
  it("reads a vowel after a sign as iotated, spelled either way", () => {
    expect(type("plat'ye")).toBe("платье");
    expect(type("plat'e")).toBe("платье");
    expect(type("ob''ekt")).toBe("объект");
    expect(type("s''est'")).toBe("съесть");
  });

  /** The sign is a word boundary only for the converter, not for the reader. */
  it("still reads a word-initial e as э", () => {
    expect(type("etazh")).toBe("этаж");
  });

  it("writes й mid-word", () => {
    expect(type("chaj")).toBe("чай");
    expect(type("mojo")).toBe("мойо");
  });

  /** `y` after a consonant is ы, which is why й needed a key of its own. */
  it("still reads a mid-word y as ы", () => {
    expect(type("ty")).toBe("ты");
  });
});

describe("TRANSLIT_KEYS", () => {
  it("covers the alphabet in order", () => {
    expect(TRANSLIT_KEYS.map((key) => key.cyrillic).join("")).toBe(
      "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
    );
  });

  /**
   * The overlay is only worth showing if it is true, and the mapping lives in
   * a third-party package that could change under us.
   */
  it.each(TRANSLIT_KEYS)("types $latin to get $cyrillic", (key) => {
    // Every row is documented for mid-word use except э, which is the one
    // letter the scheme can only spell at the start of a word.
    const wordInitialOnly = key.note?.startsWith("only at the start") ?? false;

    expect(type(wordInitialOnly ? key.latin : `b${key.latin}`)).toBe(
      wordInitialOnly ? key.cyrillic : `б${key.cyrillic}`,
    );
  });
});
