import { fillForecast, forecastPeak } from "@/lib/stats/forecast";

describe("fillForecast", () => {
  it("returns exactly seven contiguous days starting today", () => {
    const filled = fillForecast([], "2026-09-01");

    expect(filled.map((d) => d.day)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
    ]);
  });

  it("gap-fills days the query returned nothing for", () => {
    const filled = fillForecast(
      [
        { day: "2026-09-01", count: 9 },
        { day: "2026-09-04", count: 3 },
      ],
      "2026-09-01",
    );

    expect(filled.map((d) => d.count)).toEqual([9, 0, 0, 3, 0, 0, 0]);
  });

  it("drops the query's eighth day of slack", () => {
    const filled = fillForecast(
      [
        { day: "2026-09-07", count: 2 },
        { day: "2026-09-08", count: 40 },
      ],
      "2026-09-01",
    );

    expect(filled).toHaveLength(7);
    expect(filled.at(-1)).toEqual({ day: "2026-09-07", count: 2 });
  });

  it("crosses a month boundary", () => {
    const filled = fillForecast([], "2026-08-30");

    expect(filled.map((d) => d.day)).toContain("2026-09-01");
  });

  it("crosses a leap day", () => {
    const filled = fillForecast([], "2028-02-27");

    expect(filled.map((d) => d.day)).toContain("2028-02-29");
    expect(filled.map((d) => d.day)).toContain("2028-03-01");
  });
});

describe("forecastPeak", () => {
  it("is 0 for a week with nothing scheduled", () => {
    // The chart divides by this, so it must be checkable rather than NaN-prone.
    expect(forecastPeak(fillForecast([], "2026-09-01"))).toBe(0);
  });

  it("is the tallest column", () => {
    const filled = fillForecast(
      [
        { day: "2026-09-01", count: 4 },
        { day: "2026-09-03", count: 23 },
      ],
      "2026-09-01",
    );

    expect(forecastPeak(filled)).toBe(23);
  });
});
