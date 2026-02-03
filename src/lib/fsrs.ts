/**
 * FSRS Service
 * Handles spaced repetition scheduling using the ts-fsrs library
 */

import {
  Card as TsFsrsCard,
  FSRS,
  fsrs,
  FSRSParameters,
  generatorParameters,
  Grade as TsFsrsGrade,
  Rating as TsFsrsRating,
  RecordLogItem,
  ReviewLog as TsFsrsReviewLog,
  State as TsFsrsState,
} from "ts-fsrs";

import {
  Card as DbCard,
  CardState,
  Rating,
  SchedulingInfo,
} from "@/types/fsrs";

/**
 * Default FSRS parameters as specified in the requirements
 */
export const DEFAULT_FSRS_PARAMS = {
  request_retention: 0.9, // Target 90% recall probability
  maximum_interval: 36500, // ~100 years max interval
  enable_fuzz: true, // Prevent card clusters with random offsets
  enable_short_term: true, // Enable short-term scheduling
};

/**
 * Get the default FSRS parameters
 */
export function getDefaultParameters(): Partial<FSRSParameters> {
  return { ...DEFAULT_FSRS_PARAMS };
}

/**
 * Create an FSRS instance with the given parameters
 */
export function createFsrsInstance(
  customParams?: Partial<FSRSParameters>,
): FSRS {
  const params = generatorParameters({
    ...DEFAULT_FSRS_PARAMS,
    ...customParams,
  });
  return fsrs(params);
}

/**
 * Map database card state to ts-fsrs State enum
 */
export function mapStateToFsrs(state: CardState): TsFsrsState {
  switch (state) {
    case "New":
      return TsFsrsState.New;
    case "Learning":
      return TsFsrsState.Learning;
    case "Review":
      return TsFsrsState.Review;
    case "Relearning":
      return TsFsrsState.Relearning;
    default:
      return TsFsrsState.New;
  }
}

/**
 * Map ts-fsrs State enum to database card state
 */
export function mapStateToDb(state: TsFsrsState): CardState {
  switch (state) {
    case TsFsrsState.New:
      return "New";
    case TsFsrsState.Learning:
      return "Learning";
    case TsFsrsState.Review:
      return "Review";
    case TsFsrsState.Relearning:
      return "Relearning";
    default:
      return "New";
  }
}

/**
 * Map database rating to ts-fsrs Rating enum
 */
export function mapRatingToFsrs(rating: Rating): TsFsrsGrade {
  switch (rating) {
    case "Again":
      return TsFsrsRating.Again;
    case "Hard":
      return TsFsrsRating.Hard;
    case "Good":
      return TsFsrsRating.Good;
    case "Easy":
      return TsFsrsRating.Easy;
    default:
      return TsFsrsRating.Good;
  }
}

/**
 * Map ts-fsrs Rating enum to database rating
 */
export function mapRatingToDb(rating: TsFsrsRating): Rating {
  switch (rating) {
    case TsFsrsRating.Again:
      return "Again";
    case TsFsrsRating.Hard:
      return "Hard";
    case TsFsrsRating.Good:
      return "Good";
    case TsFsrsRating.Easy:
      return "Easy";
    default:
      return "Good";
  }
}

/**
 * Convert a database card to ts-fsrs card format
 */
export function mapCardToFsrs(dbCard: DbCard): TsFsrsCard {
  return {
    due: dbCard.due,
    stability: dbCard.stability,
    difficulty: dbCard.difficulty,
    elapsed_days: dbCard.elapsed_days,
    scheduled_days: dbCard.scheduled_days,
    learning_steps: dbCard.learning_steps,
    reps: dbCard.reps,
    lapses: dbCard.lapses,
    state: mapStateToFsrs(dbCard.state),
    // todo: this nested ternary looks nasty. maybe solvable if we require stronger types on date
    //  and make it not-nullable i.e. introduce initial default?
    last_review: dbCard.last_review
      ? dbCard.last_review instanceof Date
        ? dbCard.last_review
        : new Date(dbCard.last_review)
      : undefined,
  };
}

/**
 * Convert a ts-fsrs card to database card fields (partial, for updates)
 */
export function mapFsrsCardToDb(
  fsrsCard: TsFsrsCard,
): Omit<
  DbCard,
  "id" | "flashcard_id" | "user_id" | "created_at" | "updated_at"
> {
  return {
    due: fsrsCard.due,
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    elapsed_days: fsrsCard.elapsed_days,
    scheduled_days: fsrsCard.scheduled_days,
    learning_steps: fsrsCard.learning_steps,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: mapStateToDb(fsrsCard.state),
    last_review: fsrsCard.last_review || null,
  };
}

/**
 * Convert a ts-fsrs review log to database format
 */
export function mapFsrsLogToDb(log: TsFsrsReviewLog): {
  rating: Rating;
  state: CardState;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  last_elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  review: Date;
} {
  return {
    rating: mapRatingToDb(log.rating),
    state: mapStateToDb(log.state),
    due: log.due,
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    last_elapsed_days: log.last_elapsed_days,
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
    review: log.review,
  };
}

/**
 * Format a scheduled_days value to a human-readable interval string
 */
export function formatInterval(scheduledDays: number): string {
  if (scheduledDays < 1 / 24) {
    // Less than an hour
    const minutes = Math.round(scheduledDays * 24 * 60);
    return `${Math.max(1, minutes)} minute${minutes === 1 ? "" : "s"}`;
  } else if (scheduledDays < 1) {
    // Less than a day
    const hours = Math.round(scheduledDays * 24);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  } else if (scheduledDays < 30) {
    // Less than a month
    const days = Math.round(scheduledDays);
    return `${days} day${days === 1 ? "" : "s"}`;
  } else if (scheduledDays < 365) {
    // Less than a year
    const months = Math.round(scheduledDays / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  } else {
    // Years
    const years = Math.round(scheduledDays / 365);
    return `${years} year${years === 1 ? "" : "s"}`;
  }
}

/**
 * Schedule a card and return scheduling options for all four ratings
 */
export function scheduleCard(
  dbCard: DbCard,
  now: Date = new Date(),
  customParams?: Partial<FSRSParameters>,
): SchedulingInfo[] {
  const f = createFsrsInstance(customParams);
  const fsrsCard = mapCardToFsrs(dbCard);

  // Get scheduling for all ratings
  const scheduling = f.repeat(fsrsCard, now);

  // Map to our SchedulingInfo format
  const ratings: Rating[] = ["Again", "Hard", "Good", "Easy"];
  const fsrsRatings: TsFsrsGrade[] = [
    TsFsrsRating.Again,
    TsFsrsRating.Hard,
    TsFsrsRating.Good,
    TsFsrsRating.Easy,
  ];

  return ratings.map((rating, index) => {
    const fsrsRating = fsrsRatings[index];
    const result = scheduling[fsrsRating] as RecordLogItem;
    const cardFields = mapFsrsCardToDb(result.card);

    return {
      rating,
      nextReviewInterval: formatInterval(result.card.scheduled_days),
      scheduledDays: result.card.scheduled_days,
      card: cardFields,
    };
  });
}

/**
 * Process a review and return the updated card and review log
 */
export function processReview(
  dbCard: DbCard,
  rating: Rating,
  now: Date = new Date(),
  customParams?: Partial<FSRSParameters>,
): {
  updatedCard: Omit<
    DbCard,
    "id" | "flashcard_id" | "user_id" | "created_at" | "updated_at"
  >;
  reviewLog: ReturnType<typeof mapFsrsLogToDb>;
} {
  const f = createFsrsInstance(customParams);
  const fsrsCard = mapCardToFsrs(dbCard);
  const fsrsRating = mapRatingToFsrs(rating);

  // Get the scheduling for the selected rating
  const scheduling = f.repeat(fsrsCard, now);
  const result = scheduling[fsrsRating] as RecordLogItem;

  return {
    updatedCard: mapFsrsCardToDb(result.card),
    reviewLog: mapFsrsLogToDb(result.log),
  };
}
