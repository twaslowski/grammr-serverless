"use client";

import { useEffect, useRef } from "react";
import { triggerPreflightWarmup } from "@/lib/preflight";
import { LanguageCode } from "@/types/languages";

/**
 * Hook that triggers a pre-flight warmup on mount if needed.
 * Uses localStorage to track when the last warmup was performed.
 *
 * @param language - to specify which resources exactly will be woken up
 * @param cooldownMs - Optional cooldown period in milliseconds (default: 1 hour)
 */
export function usePreflightWarmup(
  language: LanguageCode,
  cooldownMs?: number,
): void {
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Prevent double-triggering in React strict mode
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    void triggerPreflightWarmup(language, cooldownMs);
  }, [language, cooldownMs]);
}
