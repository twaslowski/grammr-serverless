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
    renderHook(() => usePreflightWarmup("ru"));

    expect(mockTriggerPreflightWarmup).toHaveBeenCalledTimes(1);
    expect(mockTriggerPreflightWarmup).toHaveBeenCalledWith("ru", undefined);
  });

  it("should pass custom cooldown to triggerPreflightWarmup", () => {
    const customCooldown = 5000;
    renderHook(() => usePreflightWarmup("ru", customCooldown));

    expect(mockTriggerPreflightWarmup).toHaveBeenCalledWith(
      "ru",
      customCooldown,
    );
  });

  it("should not trigger warmup multiple times on re-render", () => {
    const { rerender } = renderHook(() => usePreflightWarmup("ru"));

    rerender();
    rerender();

    // Should only be called once despite re-renders
    expect(mockTriggerPreflightWarmup).toHaveBeenCalledTimes(1);
  });
});
