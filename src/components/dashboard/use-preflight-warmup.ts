"use client";

import { useEffect, useRef } from "react";
import { triggerPreflightWarmup } from "@/lib/preflight";

/**
 * Hook that triggers a pre-flight warmup on mount if needed.
 * Uses localStorage to track when the last warmup was performed.
 *
 * @param cooldownMs - Optional cooldown period in milliseconds (default: 1 hour)
 */
export function usePreflightWarmup(cooldownMs?: number): void {
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Prevent double-triggering in React strict mode
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    void triggerPreflightWarmup(cooldownMs);
  }, [cooldownMs]);
}
