import { formatRate, rateOf, retentionDelta } from "@/lib/stats/retention";

describe("rateOf", () => {
  it("is null for an empty window, not zero", () => {
    // 0% retention reads as catastrophic failure; "no data yet" is not that.
    expect(rateOf(0, 0)).toBeNull();
  });

  it("is 0 when every review was rated Again", () => {
    expect(rateOf(0, 20)).toBe(0);
  });

  it("is the recalled share", () => {
    expect(rateOf(91, 100)).toBeCloseTo(0.91);
  });
});

describe("retentionDelta", () => {
  it("is null when the prior window is empty", () => {
    // Otherwise a first month at 91% renders as "+91", which reads as progress.
    expect(retentionDelta(0.91, null)).toBeNull();
  });

  it("is null when the current window is empty", () => {
    expect(retentionDelta(null, 0.88)).toBeNull();
  });

  it("is the change in whole percentage points", () => {
    expect(retentionDelta(0.91, 0.88)).toBe(3);
    expect(retentionDelta(0.8, 0.86)).toBe(-6);
  });

  it("is 0 for an unchanged rate, which is not the same as absent", () => {
    expect(retentionDelta(0.9, 0.9)).toBe(0);
  });
});

describe("formatRate", () => {
  it("renders an em dash rather than 0% when there is no rate", () => {
    expect(formatRate(null)).toBe("—");
  });

  it("rounds to whole percent", () => {
    expect(formatRate(0.9149)).toBe("91%");
    expect(formatRate(0)).toBe("0%");
    expect(formatRate(1)).toBe("100%");
  });
});
