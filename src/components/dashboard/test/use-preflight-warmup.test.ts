import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";
import { usePreflightWarmup } from "@/components/dashboard/use-preflight-warmup";
import * as preflightLib from "@/lib/preflight";

// Mock the preflight library
jest.mock("@/lib/preflight", () => ({
  ...jest.requireActual("@/lib/preflight"),
  triggerPreflightWarmup: jest.fn(),
}));

const mockTriggerPreflightWarmup =
  preflightLib.triggerPreflightWarmup as jest.MockedFunction<
    typeof preflightLib.triggerPreflightWarmup
  >;

describe("usePreflightWarmup", () => {
  beforeEach(() => {
    mockTriggerPreflightWarmup.mockReset();
    mockTriggerPreflightWarmup.mockResolvedValue(true);
  });

  it("should trigger warmup on mount", () => {
    renderHook(() => usePreflightWarmup());

    expect(mockTriggerPreflightWarmup).toHaveBeenCalledTimes(1);
    expect(mockTriggerPreflightWarmup).toHaveBeenCalledWith(undefined);
  });

  it("should pass custom cooldown to triggerPreflightWarmup", () => {
    const customCooldown = 5000;
    renderHook(() => usePreflightWarmup(customCooldown));

    expect(mockTriggerPreflightWarmup).toHaveBeenCalledWith(customCooldown);
  });

  it("should not trigger warmup multiple times on re-render", () => {
    const { rerender } = renderHook(() => usePreflightWarmup());

    rerender();
    rerender();

    // Should only be called once despite re-renders
    expect(mockTriggerPreflightWarmup).toHaveBeenCalledTimes(1);
  });
});
