import { dashboardRegime } from "@/lib/stats/regime";
import { StudyStats } from "@/types/stats";

function stats(overrides: { total?: number; reviews?: number }): StudyStats {
  return {
    timeZone: "UTC",
    collection: {
      total: overrides.total ?? 0,
      new: 0,
      learning: 0,
      review: 0,
      relearning: 0,
      dueNow: 0,
      nextDue: null,
    },
    forecast: [],
    retention: {
      rate: null,
      previousRate: null,
      reviews: overrides.reviews ?? 0,
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    },
  };
}

describe("dashboardRegime", () => {
  it("is empty with no cards at all", () => {
    expect(dashboardRegime(stats({ total: 0 }))).toBe("empty");
  });

  it("is empty even if review history somehow survives the cards", () => {
    // Possible: unsubscribing from a deck drops `flashcard_study` rows.
    expect(dashboardRegime(stats({ total: 0, reviews: 12 }))).toBe("empty");
  });

  it("is fresh with one card and no reviews", () => {
    expect(dashboardRegime(stats({ total: 1, reviews: 0 }))).toBe("fresh");
  });

  it("is full at the first review", () => {
    expect(dashboardRegime(stats({ total: 1, reviews: 1 }))).toBe("full");
  });
});
