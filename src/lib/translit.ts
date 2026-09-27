import CyrillicToTranslit from "cyrillic-to-translit-js";

/**
 * Latin → Cyrillic transliteration for Russian input.
 *
 * The converter is built once at module scope. Its previous home rebuilt it on
 * every render of the tool page, which was wasted work for an object that has
 * no per-call state.
 */
const converter = CyrillicToTranslit({ preset: "ru" });

/**
 * The letter the underlying library cannot produce, patched in around it.
 *
 * `cyrillic-to-translit-js` spells й as `y` only word-initially — mid-word `y`
 * is ы, so `chay` came out as `чаы`. `j` is unused by the scheme, which makes
 * it free for й everywhere.
 *
 * Patching is safe because the library appends characters it has no mapping
 * for verbatim, so `j` survives `reverse` untouched and can be substituted
 * afterwards.
 */
const PATCHED = /[jJ]/g;

const PATCHED_TO_CYRILLIC: Record<string, string> = {
  j: "й",
  J: "Й",
};

/**
 * The signs, written as apostrophes, and where the reverse pass is restarted.
 *
 * The library transliterates ь and ъ to the empty string, and inverting that
 * map loses them: before this, no sequence of keystrokes produced either sign,
 * so `день` and `объект` were simply untypable. Apostrophes are free to stand
 * in for them because the library passes characters it has no mapping for
 * through `reverse` verbatim.
 *
 * Each sign also ends a run: a vowel after one is iotated, and the library
 * only reads `ye` as е at the start of a word, so `pod''yezd` came out as
 * `подъыезд`. Reversing the runs between signs separately puts what follows a
 * sign in the word-initial position the letters there are spelled for.
 *
 * Both spellings break a run, because `latinToCyrillic` is handed a
 * half-converted string: a sign reaches it as the apostrophes just typed, or
 * as the letter an earlier keystroke has already settled. Longest first: `''`
 * must be matched before `'`.
 */
const SIGN = /(''|'|ь|ъ)/;

const SIGN_TO_CYRILLIC: Record<string, string> = {
  "''": "ъ",
  "'": "ь",
  ь: "ь",
  ъ: "ъ",
};

/** Whether the next letter stands where a word's first letter would. */
function opensWord(char: string): boolean {
  return char === " " || char === "ь" || char === "ъ";
}

/**
 * Latin spellings to re-open a Cyrillic letter with, where the library's own
 * forward pass gives the wrong answer.
 *
 * `transform` always treats its argument as word-initial, and it is not a
 * faithful inverse: it spells ы as `i`, which reads back as и, and ь and ъ as
 * nothing at all. Re-opening `ы` as `i` is how typing `byt` used to produce
 * `бит`. Letters absent from both tables round-trip through `transform`
 * correctly and are left to it.
 */
const RE_OPEN_INITIAL: Record<string, string> = {
  ь: "'",
  ъ: "''",
};

const RE_OPEN_MEDIAL: Record<string, string> = {
  ...RE_OPEN_INITIAL,
  // `y` is ы mid-word, so й needs the key that means й in every position.
  й: "j",
  ы: "y",
  // `transform` would give `ye`, the word-initial spelling, which mid-word
  // reads back as `ые`.
  е: "e",
};

/**
 * Converts one run of text between signs, which `reverse` therefore reads as a
 * word of its own.
 *
 * `afterSign` respells a leading bare `e` as `ye`. Opening a word, `e` is э —
 * but э never follows a sign in Russian, and the scheme documents `e` as the
 * way to type е anywhere but the start of a word, which is where the reader
 * believes they are when they type `plat'e`.
 */
function convertRun(latin: string, afterSign: boolean): string {
  const text =
    afterSign && (latin[0] === "e" || latin[0] === "E")
      ? `${latin[0] === "e" ? "y" : "Y"}${latin}`
      : latin;

  return converter
    .reverse(text)
    .replace(PATCHED, (match) => PATCHED_TO_CYRILLIC[match]);
}

/**
 * Converts a Latin transcription to Cyrillic. Text that is already Cyrillic
 * passes through untouched.
 */
export function latinToCyrillic(text: string): string {
  if (!text) return text;
  return text
    .split(SIGN)
    .map((part, index) =>
      index % 2 === 1 ? SIGN_TO_CYRILLIC[part] : convertRun(part, index > 0),
    )
    .join("");
}

/**
 * Re-latinizes text so it can be converted again, undoing what was typed.
 *
 * `atWordStart` says whether the first character begins a word, because two
 * letters are spelled differently there: `ye`/`e` for е, and `y`/`j` for й.
 * A sign counts, since the run after one is converted as its own word.
 */
function relatinize(text: string, atWordStart: boolean): string {
  let latin = "";
  let wordStart = atWordStart;

  for (const char of text) {
    const table = wordStart ? RE_OPEN_INITIAL : RE_OPEN_MEDIAL;
    latin += table[char] ?? converter.transform(char);
    wordStart = opensWord(char);
  }

  return latin;
}

/**
 * Converts what the reader just typed, leaving what they already typed alone.
 *
 * `previous` is the value currently shown in the field — already Cyrillic —
 * and `next` is what the input event produced, so `next` is normally
 * `previous` with a Latin character or two appended.
 *
 * The last few characters of `previous` are re-opened rather than left alone:
 * they may be the partial conversion of a Latin sequence the new character
 * completes, since the mapping is not one character to one. `z` shows as `з`
 * until an `h` arrives to make it `ж`, and `shc` shows as `шc` until an `h`
 * arrives to make it `щ` — the longest sequence in the scheme, and the reason
 * the window is two characters rather than one.
 *
 * Only that window is re-opened. Re-converting the whole buffer would rewrite
 * text the reader has already accepted and drag the caret with it, and the
 * scheme is greedy enough to corrupt it: `отс` re-latinizes to `ots`, whose
 * `ts` reads back as `ц`.
 *
 * The already-settled prefix is still handed to the converter, Cyrillic and
 * unchanged, because it passes through untouched and supplies the position the
 * re-opened characters sit in. Without it they would be read as word-initial,
 * where `y` is й rather than ы.
 *
 * Anything that is not an append — a mid-string edit, a deletion, a paste over
 * a selection — converts the whole buffer, which is the best available guess.
 *
 * A trailing `s` showing as `с` until an `h` follows is inherent to converting
 * as you type. The alternative is not showing the reader what they typed.
 */
const RE_OPEN_WINDOW = 2;

export function convertTyped(previous: string, next: string): string {
  if (next.startsWith(previous) && next.length > previous.length) {
    const tail = next.slice(previous.length);
    const stable = previous.slice(0, -RE_OPEN_WINDOW);
    const reopened = relatinize(
      previous.slice(-RE_OPEN_WINDOW),
      stable === "" || opensWord(stable.slice(-1)),
    );
    return latinToCyrillic(stable + reopened + tail);
  }
  return latinToCyrillic(next);
}

export interface TranslitKey {
  cyrillic: string;
  /** What to type to get it, in the position the reader is most likely to. */
  latin: string;
  /** Set only where the letter needs a caveat; drives the overlay's footnotes. */
  note?: string;
}

/**
 * The full scheme, in alphabetical order, as shown in the help overlay.
 *
 * This is documentation, so it is a hand-written list rather than something
 * derived from the converter — but `translit.test.ts` types every row and
 * asserts it produces the letter claimed, so it cannot drift.
 */
export const TRANSLIT_KEYS: readonly TranslitKey[] = [
  { cyrillic: "а", latin: "a" },
  { cyrillic: "б", latin: "b" },
  { cyrillic: "в", latin: "v" },
  { cyrillic: "г", latin: "g" },
  { cyrillic: "д", latin: "d" },
  { cyrillic: "е", latin: "e", note: "ye at the start of a word" },
  { cyrillic: "ё", latin: "yo" },
  { cyrillic: "ж", latin: "zh" },
  { cyrillic: "з", latin: "z" },
  { cyrillic: "и", latin: "i" },
  { cyrillic: "й", latin: "j", note: "y also works, but only word-initially" },
  { cyrillic: "к", latin: "k" },
  { cyrillic: "л", latin: "l" },
  { cyrillic: "м", latin: "m" },
  { cyrillic: "н", latin: "n" },
  { cyrillic: "о", latin: "o" },
  { cyrillic: "п", latin: "p" },
  { cyrillic: "р", latin: "r" },
  { cyrillic: "с", latin: "s" },
  { cyrillic: "т", latin: "t" },
  { cyrillic: "у", latin: "u" },
  { cyrillic: "ф", latin: "f" },
  { cyrillic: "х", latin: "kh" },
  { cyrillic: "ц", latin: "ts" },
  { cyrillic: "ч", latin: "ch" },
  { cyrillic: "ш", latin: "sh" },
  { cyrillic: "щ", latin: "shch" },
  { cyrillic: "ъ", latin: "''", note: "hard sign — two apostrophes" },
  { cyrillic: "ы", latin: "y", note: "never at the start of a word" },
  { cyrillic: "ь", latin: "'", note: "soft sign — one apostrophe" },
  { cyrillic: "э", latin: "e", note: "only at the start of a word" },
  { cyrillic: "ю", latin: "yu" },
  { cyrillic: "я", latin: "ya" },
];
