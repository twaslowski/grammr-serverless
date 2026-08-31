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

import { formatInterval, intervalInDays } from "@/lib/interval";
import {
  CardState,
  Rating,
  ReviewLogEntry,
  ScheduledState,
  SchedulingInfo,
} from "@/types/fsrs";

// Re-exported rather than moved outright: `@/lib/interval` is the definition,
// but scheduling and interval formatting are one subject to most callers.
export { formatInterval, intervalInDays };

/**
 * Default FSRS parameters as specified in the requirements
 *
 * The learning/relearning steps are spelled out rather than left to the
 * library defaults because they drive every sub-day interval a user sees:
 * Again/Good land on the first/last step, Hard on the midpoint between them.
 */
export const DEFAULT_FSRS_PARAMS = {
  request_retention: 0.9, // Target 90% recall probability
  maximum_interval: 36500, // ~100 years max interval
  enable_fuzz: true, // Prevent card clusters with random offsets
  enable_short_term: true, // Enable short-term scheduling
  learning_steps: ["1m", "10m"], // New cards: Again 1m, Hard 6m, Good 10m
  relearning_steps: ["10m"], // Lapsed cards: Again 10m
} satisfies Partial<FSRSParameters>;

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
 * Convert a `flashcard_study` row to ts-fsrs card format.
 *
 * This is where camelCase becomes snake_case: ts-fsrs uses snake_case field
 * names, nothing else in the app does.
 */
export function mapCardToFsrs(card: ScheduledState): TsFsrsCard {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    state: mapStateToFsrs(card.state),
    // ts-fsrs distinguishes "never reviewed" with undefined, the column with null.
    last_review: card.lastReview ?? undefined,
  };
}

/**
 * Convert a ts-fsrs card back to the columns a `flashcard_study` update sets.
 *
 * The result is directly assignable to a Drizzle `.set()`, which is why the
 * routes no longer restate the field names themselves.
 */
export function mapFsrsCardToDb(fsrsCard: TsFsrsCard): ScheduledState {
  return {
    due: fsrsCard.due,
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    elapsedDays: fsrsCard.elapsed_days,
    scheduledDays: fsrsCard.scheduled_days,
    learningSteps: fsrsCard.learning_steps,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: mapStateToDb(fsrsCard.state),
    lastReview: fsrsCard.last_review || null,
  };
}

/**
 * Convert a ts-fsrs review log to the columns a `review_log` insert supplies.
 * Directly assignable to a Drizzle `.values()`, minus the owning row's id.
 */
export function mapFsrsLogToDb(log: TsFsrsReviewLog): ReviewLogEntry {
  return {
    rating: mapRatingToDb(log.rating),
    state: mapStateToDb(log.state),
    due: log.due,
    stability: log.stability,
    difficulty: log.difficulty,
    elapsedDays: log.elapsed_days,
    lastElapsedDays: log.last_elapsed_days,
    scheduledDays: log.scheduled_days,
    learningSteps: log.learning_steps,
    review: log.review,
  };
}

/**
 * Schedule a card and return scheduling options for all four ratings
 */
export function scheduleCard(
  card: ScheduledState,
  now: Date = new Date(),
  customParams?: Partial<FSRSParameters>,
): SchedulingInfo[] {
  const f = createFsrsInstance(customParams);
  const fsrsCard = mapCardToFsrs(card);

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

    // `scheduled_days` is 0 for intra-day steps, so the label has to come from
    // the actual due date; `scheduledDays` stays the raw FSRS value the row stores.
    return {
      rating,
      nextReviewInterval: formatInterval(intervalInDays(result.card.due, now)),
      scheduledDays: result.card.scheduled_days,
      card: cardFields,
    };
  });
}

/**
 * Process a review and return the updated card and review log
 */
export function processReview(
  card: ScheduledState,
  rating: Rating,
  now: Date = new Date(),
  customParams?: Partial<FSRSParameters>,
): {
  updatedCard: ScheduledState;
  reviewLog: ReviewLogEntry;
} {
  const f = createFsrsInstance(customParams);
  const fsrsCard = mapCardToFsrs(card);
  const fsrsRating = mapRatingToFsrs(rating);

  // Get the scheduling for the selected rating
  const scheduling = f.repeat(fsrsCard, now);
  const result = scheduling[fsrsRating] as RecordLogItem;

  return {
    updatedCard: mapFsrsCardToDb(result.card),
    reviewLog: mapFsrsLogToDb(result.log),
  };
}
