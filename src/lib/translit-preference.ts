"use client";

/**
 * Whether Latin → Cyrillic conversion is on, shared across every input that
 * offers it and remembered between visits.
 *
 * An external store rather than component state for two reasons: the dictionary
 * search and the translate box can be reached in the same session and should
 * agree, and reading `localStorage` in a `useState` initialiser would produce a
 * hydration mismatch. `getServerSnapshot` therefore returns `false` — the field
 * renders off during SSR and corrects itself on hydration, which is the same
 * pattern `src/lib/client-only.ts` uses.
 */

const STORAGE_KEY = "grammr.translit";

/**
 * `storage` only fires in *other* tabs, so a local event carries the change to
 * the other inputs on this page.
 */
const LOCAL_EVENT = "grammr:translit-change";

/**
 * Used only when `localStorage` is unavailable — private mode, or storage
 * blocked outright. The toggle then works for the session and forgets on
 * reload, which is better than not working at all.
 *
 * There is deliberately no cache in front of a *working* `localStorage`: the
 * snapshot is a boolean, so `useSyncExternalStore` compares it by value and a
 * read per render costs nothing worth managing invalidation for.
 */
let fallback = false;
let storageWorks = true;

export function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

export function getSnapshot(): boolean {
  if (!storageWorks) return fallback;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    storageWorks = false;
    return fallback;
  }
}

export function getServerSnapshot(): boolean {
  return false;
}

export function setTranslitEnabled(enabled: boolean): void {
  fallback = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Storage is denied; fall back to the in-memory value from here on, or the
    // next read would report the old setting back at us.
    storageWorks = false;
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}
