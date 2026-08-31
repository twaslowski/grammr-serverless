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
 * Converts a Latin transcription to Cyrillic. Text that is already Cyrillic
 * passes through untouched.
 */
export function latinToCyrillic(text: string): string {
  if (!text) return text;
  return converter.reverse(text);
}

/**
 * Converts what the reader just typed, leaving what they already typed alone.
 *
 * `previous` is the value currently shown in the field — already Cyrillic —
 * and `next` is what the input event produced, so `next` is normally
 * `previous` with a Latin character or two appended. Only that tail is
 * converted.
 *
 * Doing it this way matters because the mapping is not one character to one:
 * `sh` becomes a single `ш`. Re-converting the whole buffer on every keystroke
 * would rewrite text the reader has already accepted and drag the caret with
 * it, and would mangle any Cyrillic already in the field on a second pass.
 *
 * Anything that is not an append — a mid-string edit, a deletion, a paste over
 * a selection — converts the whole buffer, which is the best available guess.
 *
 * A trailing `s` showing as `с` until an `h` follows is inherent to converting
 * as you type. The alternative is not showing the reader what they typed.
 */
export function convertTyped(previous: string, next: string): string {
  if (next.startsWith(previous) && next.length > previous.length) {
    return previous + latinToCyrillic(next.slice(previous.length));
  }
  return latinToCyrillic(next);
}
