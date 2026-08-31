"use client";

import { useCallback, useSyncExternalStore } from "react";

import { convertTyped } from "@/lib/translit";
import {
  getServerSnapshot,
  getSnapshot,
  setTranslitEnabled,
  subscribe,
} from "@/lib/translit-preference";

export interface Translit {
  enabled: boolean;
  toggle: () => void;
  /**
   * Maps a raw input value to what should be shown. A no-op when the toggle is
   * off, so callers can route every change through it unconditionally.
   */
  convert: (previous: string, next: string) => string;
}

/**
 * Latin → Cyrillic conversion for a text input.
 *
 * The preference is global and persisted, so turning it on in the dictionary
 * leaves it on in the translate box; see `src/lib/translit-preference.ts`.
 */
export function useTranslit(): Translit {
  const enabled = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => setTranslitEnabled(!enabled), [enabled]);

  const convert = useCallback(
    (previous: string, next: string) =>
      enabled ? convertTyped(previous, next) : next,
    [enabled],
  );

  return { enabled, toggle, convert };
}
