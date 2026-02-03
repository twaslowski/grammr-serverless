/**
 * FSRS Service Tests
 * Tests for the spaced repetition scheduling service using ts-fsrs
 */

import {
  createEmptyCard,
  Rating as TsFsrsRating,
  State as TsFsrsState,
} from "ts-fsrs";

import {
  createFsrsInstance,
  formatInterval,
  getDefaultParameters,
  mapCardToFsrs,
  mapFsrsCardToDb,
  mapFsrsLogToDb,
  mapRatingToFsrs,
  mapStateToDb,
  scheduleCard,
} from "@/lib/fsrs";
import { Card as DbCard } from "@/types/fsrs";

describe("FSRS Service", () => {
  describe("createFsrsInstance", () => {
    it("should create an FSRS instance with default parameters", () => {
      const fsrs = createFsrsInstance();
      expect(fsrs).toBeDefined();
    });

    it("should create an FSRS instance with custom parameters", () => {
      const fsrs = createFsrsInstance({
        request_retention: 0.85,
        maximum_interval: 180,
      });
      expect(fsrs).toBeDefined();
    });
  });

  describe("getDefaultParameters", () => {
    it("should return default parameters", () => {
      const params = getDefaultParameters();
      expect(params.request_retention).toBe(0.9);
      expect(params.maximum_interval).toBe(36500);
      expect(params.enable_fuzz).toBe(true);
    });
  });

  describe("scheduleCard", () => {
    it("should generate scheduling options for all four ratings", () => {
      const now = new Date("2026-01-21T10:00:00Z");
      const dbCard: DbCard = {
        id: 1,
        flashcard_id: 1,
        user_id: "user-123",
        due: now,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        learning_steps: 0,
        reps: 0,
        lapses: 0,
        state: "New",
        last_review: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const result = scheduleCard(dbCard, now);

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.rating)).toEqual([
        "Again",
        "Hard",
        "Good",
        "Easy",
      ]);

      // Each scheduling option should have card data and interval info
      result.forEach((option) => {
        expect(option.scheduledDays).toBeDefined();
        expect(option.nextReviewInterval).toBeDefined();
        expect(option.card).toBeDefined();
      });
    });

    it("should schedule a new card with appropriate intervals", () => {
      const now = new Date("2026-01-21T10:00:00Z");
      const dbCard: DbCard = {
        id: 1,
        flashcard_id: 1,
        user_id: "user-123",
        due: now,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        learning_steps: 0,
        reps: 0,
        lapses: 0,
        state: "New",
        last_review: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const result = scheduleCard(dbCard, now);

      // For a new card, Again should have a short interval
      const againOption = result.find((r) => r.rating === "Again");
      expect(againOption).toBeDefined();
      expect(againOption!.scheduledDays).toBeLessThanOrEqual(1);

      // Easy should have a longer interval
      const easyOption = result.find((r) => r.rating === "Easy");
      expect(easyOption).toBeDefined();
      expect(easyOption!.scheduledDays).toBeGreaterThanOrEqual(1);
    });

    it("should schedule a review card with longer intervals", () => {
      const now = new Date("2026-01-21T10:00:00Z");
      const dbCard: DbCard = {
        id: 1,
        flashcard_id: 1,
        user_id: "user-123",
        due: now,
        stability: 10, // Card has some stability
        difficulty: 5,
        elapsed_days: 10,
        scheduled_days: 10,
        learning_steps: 0,
        reps: 5, // Has been reviewed
        lapses: 0,
        state: "Review",
        last_review: new Date("2026-01-11T10:00:00Z"),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const result = scheduleCard(dbCard, now);

      // For a review card, intervals should generally be longer
      const goodOption = result.find((r) => r.rating === "Good");
      expect(goodOption).toBeDefined();
      expect(goodOption!.scheduledDays).toBeGreaterThan(0);
    });
  });

  describe("formatInterval", () => {
    it("should format minutes correctly", () => {
      expect(formatInterval(0)).toContain("minute");
    });

    it("should format hours correctly", () => {
      // A small fraction of a day
      const hours = 0.25; // 6 hours
      expect(formatInterval(hours)).toContain("hour");
    });

    it("should format days correctly", () => {
      expect(formatInterval(1)).toBe("1 day");
      expect(formatInterval(2)).toBe("2 days");
      expect(formatInterval(7)).toBe("7 days");
    });

    it("should format months correctly", () => {
      expect(formatInterval(30)).toContain("month");
      expect(formatInterval(60)).toContain("month");
    });

    it("should format years correctly", () => {
      expect(formatInterval(365)).toContain("year");
      expect(formatInterval(730)).toContain("year");
    });
  });

  describe("mapCardToFsrs", () => {
    it("should convert a database card to ts-fsrs card format", () => {
      const now = new Date("2026-01-21T10:00:00Z");
      const dbCard: DbCard = {
        id: 1,
        flashcard_id: 1,
        user_id: "user-123",
        due: now,
        stability: 5.5,
        difficulty: 4.2,
        elapsed_days: 10,
        scheduled_days: 15,
        learning_steps: 0,
        reps: 3,
        lapses: 1,
        state: "Review",
        last_review: new Date("2026-01-06T10:00:00Z"),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const fsrsCard = mapCardToFsrs(dbCard);

      expect(fsrsCard.due).toEqual(now);
      expect(fsrsCard.stability).toBe(5.5);
      expect(fsrsCard.difficulty).toBe(4.2);
      expect(fsrsCard.elapsed_days).toBe(10);
      expect(fsrsCard.scheduled_days).toBe(15);
      expect(fsrsCard.reps).toBe(3);
      expect(fsrsCard.lapses).toBe(1);
      expect(fsrsCard.state).toBe(TsFsrsState.Review);
    });

    it("should map all card states correctly", () => {
      const baseCard: DbCard = {
        id: 1,
        flashcard_id: 1,
        user_id: "user-123",
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        learning_steps: 0,
        reps: 0,
        lapses: 0,
        state: "New",
        last_review: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(mapCardToFsrs({ ...baseCard, state: "New" }).state).toBe(
        TsFsrsState.New,
      );
      expect(mapCardToFsrs({ ...baseCard, state: "Learning" }).state).toBe(
        TsFsrsState.Learning,
      );
      expect(mapCardToFsrs({ ...baseCard, state: "Review" }).state).toBe(
        TsFsrsState.Review,
      );
      expect(mapCardToFsrs({ ...baseCard, state: "Relearning" }).state).toBe(
        TsFsrsState.Relearning,
      );
    });
  });

  describe("mapFsrsCardToDb", () => {
    it("should convert a ts-fsrs card to database format", () => {
      const now = new Date("2026-01-21T10:00:00Z");
      const fsrsCard = createEmptyCard(now);

      const dbFields = mapFsrsCardToDb(fsrsCard);

      expect(dbFields.due).toEqual(now);
      expect(dbFields.stability).toBe(0);
      expect(dbFields.difficulty).toBe(0);
      expect(dbFields.state).toBe("New");
      expect(dbFields.reps).toBe(0);
    });
  });

  describe("mapFsrsLogToDb", () => {
    it("should convert a ts-fsrs review log to database format", () => {
      const fsrs = createFsrsInstance();
      const now = new Date("2026-01-21T10:00:00Z");
      const card = createEmptyCard(now);

      const scheduling = fsrs.repeat(card, now);
      const goodResult = scheduling[TsFsrsRating.Good];

      const dbLog = mapFsrsLogToDb(goodResult.log);

      expect(dbLog.rating).toBe("Good");
      expect(dbLog.state).toBeDefined();
      expect(dbLog.review).toBeDefined();
      expect(typeof dbLog.elapsed_days).toBe("number");
      expect(typeof dbLog.scheduled_days).toBe("number");
    });
  });

  describe("mapRatingToFsrs", () => {
    it("should map all rating values correctly", () => {
      expect(mapRatingToFsrs("Again")).toBe(TsFsrsRating.Again);
      expect(mapRatingToFsrs("Hard")).toBe(TsFsrsRating.Hard);
      expect(mapRatingToFsrs("Good")).toBe(TsFsrsRating.Good);
      expect(mapRatingToFsrs("Easy")).toBe(TsFsrsRating.Easy);
    });
  });

  describe("mapStateToDb", () => {
    it("should map all state values correctly", () => {
      expect(mapStateToDb(TsFsrsState.New)).toBe("New");
      expect(mapStateToDb(TsFsrsState.Learning)).toBe("Learning");
      expect(mapStateToDb(TsFsrsState.Review)).toBe("Review");
      expect(mapStateToDb(TsFsrsState.Relearning)).toBe("Relearning");
    });
  });
});

describe("FSRS Integration", () => {
  it("should simulate a complete review session", () => {
    const startDate = new Date("2026-01-21T10:00:00Z");

    // Create a new card
    const dbCard: DbCard = {
      id: 1,
      flashcard_id: 1,
      user_id: "user-123",
      due: startDate,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      state: "New",
      last_review: null,
      created_at: startDate.toISOString(),
      updated_at: startDate.toISOString(),
    };

    // First review - rate as Good
    const firstScheduling = scheduleCard(dbCard, startDate);
    const goodOption = firstScheduling.find((r) => r.rating === "Good")!;

    expect(goodOption.card.state).not.toBe("New");
    expect(goodOption.card.reps).toBe(1);

    // Simulate second review after the scheduled interval
    const secondReviewDate = new Date(goodOption.card.due);
    const updatedCard: DbCard = {
      ...dbCard,
      ...goodOption.card,
      last_review: startDate,
    };

    const secondScheduling = scheduleCard(updatedCard, secondReviewDate);

    // Verify scheduling continues to work
    expect(secondScheduling).toHaveLength(4);
    const secondGoodOption = secondScheduling.find((r) => r.rating === "Good")!;
    expect(secondGoodOption.card.reps).toBe(2);
  });

  it("should handle lapse (Again rating) correctly", () => {
    const startDate = new Date("2026-01-21T10:00:00Z");

    // Create a review card (has been studied before)
    const dbCard: DbCard = {
      id: 1,
      flashcard_id: 1,
      user_id: "user-123",
      due: startDate,
      stability: 10,
      difficulty: 5,
      elapsed_days: 10,
      scheduled_days: 10,
      learning_steps: 0,
      reps: 5,
      lapses: 0,
      state: "Review",
      last_review: new Date("2026-01-11T10:00:00Z"),
      created_at: startDate.toISOString(),
      updated_at: startDate.toISOString(),
    };

    const scheduling = scheduleCard(dbCard, startDate);
    const againOption = scheduling.find((r) => r.rating === "Again")!;

    // After a lapse, the card should be in relearning state
    expect(againOption.card.lapses).toBe(1);
    expect(againOption.card.state).toBe("Relearning");
  });
});
