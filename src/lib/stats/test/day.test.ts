import {
  addDays,
  localDay,
  parseDay,
  weekdayInitial,
  weekdayName,
} from "@/lib/stats/day";

describe("parseDay", () => {
  it("reads a day string at UTC midnight", () => {
    expect(parseDay("2026-09-01")).toBe(Date.UTC(2026, 8, 1));
  });

  it("is NaN for anything that is not a day string", () => {
    expect(parseDay("2026-9-1")).toBeNaN();
    expect(parseDay("")).toBeNaN();
  });
});

describe("addDays", () => {
  it("crosses months, years and leap days without DST error", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("crosses a European DST boundary and still advances one day", () => {
    // 2026-03-29 is the spring-forward date in Europe/Berlin. Doing this with
    // a local Date would land back on the same calendar day.
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
  });

  it("goes backwards", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });
});

describe("localDay", () => {
  it("projects an instant into the requested zone", () => {
    // 22:30 UTC is already the next day in Berlin.
    const instant = new Date("2026-09-01T22:30:00Z");

    expect(localDay(instant, "UTC")).toBe("2026-09-01");
    expect(localDay(instant, "Europe/Berlin")).toBe("2026-09-02");
  });

  it("projects backwards for western zones", () => {
    const instant = new Date("2026-09-01T02:00:00Z");

    expect(localDay(instant, "America/New_York")).toBe("2026-08-31");
  });

  it("zero-pads single-digit months and days", () => {
    expect(localDay(new Date("2026-01-05T12:00:00Z"), "UTC")).toBe(
      "2026-01-05",
    );
  });
});

describe("weekday labels", () => {
  it("labels a known date", () => {
    // 2026-09-01 is a Tuesday.
    expect(weekdayName("2026-09-01")).toBe("Tuesday");
    expect(weekdayInitial("2026-09-01")).toBe("T");
  });

  it("is independent of the host time zone", () => {
    expect(weekdayName("2026-09-06")).toBe("Sunday");
    expect(weekdayInitial("2026-09-06")).toBe("S");
  });
});
