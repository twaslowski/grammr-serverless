"use client";

import { useSyncExternalStore } from "react";

/**
 * Hooks for reading browser-only state.
 *
 * These use `useSyncExternalStore` rather than `useState` + `useEffect` so the
 * value is read during render on the client and returns a stable server
 * snapshot during SSR. Setting the same state from inside an effect would
 * trigger a cascading re-render on every mount.
 */

/** No browser state to subscribe to; the snapshot never changes after hydration. */
const noopSubscribe = () => () => {};

/**
 * `false` while server-rendering and on the hydration pass, `true` afterwards.
 * Use to gate UI that would otherwise mismatch between server and client.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** True when the app is running as an installed PWA rather than in a tab. */
export function useIsStandalone(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(display-mode: standalone)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
}

/** True on iOS, which has no `beforeinstallprompt` and needs manual install steps. */
export function useIsIOS(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream,
    () => false,
  );
}
