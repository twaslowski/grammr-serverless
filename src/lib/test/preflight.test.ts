import "@testing-library/jest-dom";
import {
  getLastWarmupTimestamp,
  setLastWarmupTimestamp,
  isWarmupNeeded,
  triggerPreflightWarmup,
  PREFLIGHT_STORAGE_KEY,
  DEFAULT_COOLDOWN_MS,
} from "@/lib/preflight";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("preflight warmup", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset fetch mock
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe("getLastWarmupTimestamp", () => {
    it("should return null when no timestamp is stored", () => {
      expect(getLastWarmupTimestamp()).toBeNull();
    });

    it("should return the stored timestamp", () => {
      const timestamp = Date.now();
      localStorage.setItem(PREFLIGHT_STORAGE_KEY, timestamp.toString());
      expect(getLastWarmupTimestamp()).toBe(timestamp);
    });

    it("should return null for invalid timestamp", () => {
      localStorage.setItem(PREFLIGHT_STORAGE_KEY, "invalid");
      expect(getLastWarmupTimestamp()).toBeNull();
    });
  });

  describe("setLastWarmupTimestamp", () => {
    it("should store the timestamp in localStorage", () => {
      const timestamp = Date.now();
      setLastWarmupTimestamp(timestamp);
      expect(localStorage.getItem(PREFLIGHT_STORAGE_KEY)).toBe(
        timestamp.toString(),
      );
    });
  });

  describe("isWarmupNeeded", () => {
    it("should return true when no previous warmup exists", () => {
      expect(isWarmupNeeded()).toBe(true);
    });

    it("should return false when warmup was recently performed", () => {
      setLastWarmupTimestamp(Date.now());
      expect(isWarmupNeeded()).toBe(false);
    });

    it("should return true when cooldown has elapsed", () => {
      const oldTimestamp = Date.now() - DEFAULT_COOLDOWN_MS - 1000;
      setLastWarmupTimestamp(oldTimestamp);
      expect(isWarmupNeeded()).toBe(true);
    });

    it("should respect custom cooldown period", () => {
      const customCooldown = 5000; // 5 seconds
      const recentTimestamp = Date.now() - 2000; // 2 seconds ago
      setLastWarmupTimestamp(recentTimestamp);
      expect(isWarmupNeeded(customCooldown)).toBe(false);

      const oldTimestamp = Date.now() - customCooldown - 1000;
      setLastWarmupTimestamp(oldTimestamp);
      expect(isWarmupNeeded(customCooldown)).toBe(true);
    });
  });

  describe("triggerPreflightWarmup", () => {
    it("should trigger a warmup request when needed", async () => {
      const result = await triggerPreflightWarmup();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/v1/pre-flight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should update localStorage timestamp after triggering warmup", async () => {
      const before = Date.now();
      await triggerPreflightWarmup();
      const after = Date.now();

      const stored = getLastWarmupTimestamp();
      expect(stored).toBeGreaterThanOrEqual(before);
      expect(stored).toBeLessThanOrEqual(after);
    });

    it("should not trigger warmup when cooldown has not elapsed", async () => {
      setLastWarmupTimestamp(Date.now());

      const result = await triggerPreflightWarmup();

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should trigger warmup when cooldown has elapsed", async () => {
      const oldTimestamp = Date.now() - DEFAULT_COOLDOWN_MS - 1000;
      setLastWarmupTimestamp(oldTimestamp);

      const result = await triggerPreflightWarmup();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should handle fetch errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      // Should not throw
      const result = await triggerPreflightWarmup();

      // Should still update timestamp to prevent retries
      expect(result).toBe(true);
    });
  });
});
