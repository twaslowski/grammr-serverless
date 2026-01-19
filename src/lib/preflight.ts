const PREFLIGHT_STORAGE_KEY = "grammr_preflight_last_warmup";
const DEFAULT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get the timestamp of the last warmup from localStorage
 */
export function getLastWarmupTimestamp(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(PREFLIGHT_STORAGE_KEY);
  if (!stored) return null;
  const timestamp = parseInt(stored, 10);
  return isNaN(timestamp) ? null : timestamp;
}

/**
 * Set the last warmup timestamp in localStorage
 */
export function setLastWarmupTimestamp(timestamp: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFLIGHT_STORAGE_KEY, timestamp.toString());
}

/**
 * Check if a warmup is needed based on the cooldown period
 */
export function isWarmupNeeded(
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): boolean {
  const lastWarmup = getLastWarmupTimestamp();
  if (lastWarmup === null) return true;
  return Date.now() - lastWarmup >= cooldownMs;
}

/**
 * Trigger a pre-flight warmup request if needed.
 * Returns true if warmup was triggered, false otherwise.
 */
export async function triggerPreflightWarmup(
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): Promise<boolean> {
  if (!isWarmupNeeded(cooldownMs)) {
    return false;
  }

  try {
    // Fire and forget - we don't wait for the response
    fetch("/api/v1/pre-flight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {
      // Ignore errors - warmup is best-effort
    });

    // Update the timestamp immediately to prevent duplicate requests
    setLastWarmupTimestamp(Date.now());
    return true;
  } catch {
    // Ignore errors
    return false;
  }
}

export { PREFLIGHT_STORAGE_KEY, DEFAULT_COOLDOWN_MS };
