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

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;
const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;

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

function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

/** Round to at most one decimal so long intervals keep some resolution */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Format an interval expressed in (possibly fractional) days as a
 * human-readable string.
 *
 * Note this must be given the real interval, not a card's `scheduled_days`:
 * FSRS reports `scheduled_days === 0` for every intra-day learning and
 * relearning step, so formatting that field collapses 1m/6m/10m into "1 minute".
 */
export function formatInterval(days: number): string {
  const minutes = Math.round(days * 24 * 60);
  if (minutes < 60) {
    return pluralize(Math.max(1, minutes), "minute");
  }

  const hours = Math.round(days * 24);
  if (hours < 24) {
    return pluralize(hours, "hour");
  }

  if (days < 30) {
    return pluralize(Math.round(days), "day");
  }

  if (days < 365) {
    return pluralize(round1(days / DAYS_PER_MONTH), "month");
  }

  return pluralize(round1(days / DAYS_PER_YEAR), "year");
}

/**
 * The interval, in fractional days, between `now` and when the card falls due.
 */
export function intervalInDays(due: Date, now: Date): number {
  return Math.max(0, (due.getTime() - now.getTime()) / MS_PER_DAY);
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
