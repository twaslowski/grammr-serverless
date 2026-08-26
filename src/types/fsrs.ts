import { z } from "zod";

import { FlashcardSchema } from "@/types/flashcards";
import { LanguageCodeSchema } from "@/types/languages";

/**
 * FSRS (Free Spaced Repetition Scheduler) types.
 *
 * These describe the `flashcard_study` and `review_log` rows as they travel over
 * the wire, and are camelCase like every other schema in `src/types` — so a
 * Drizzle row satisfies them as-is, with no field-by-field remapping.
 *
 * `ts-fsrs` itself uses snake_case. `src/lib/fsrs.ts` is the only module that
 * speaks it; the mappers there are the single translation layer.
 */

/** A timestamp as it arrives: a `Date` from Drizzle, an ISO string over the wire. */
const WireDate = z
  .union([z.string(), z.date()])
  .transform((value) => new Date(value));

const NullableWireDate = z
  .union([z.string(), z.date()])
  .nullable()
  .transform((value) => (value ? new Date(value) : null));

// Card state enum - matches ts-fsrs State enum
export const CardStateEnum = z.enum([
  "New",
  "Learning",
  "Review",
  "Relearning",
]);
export type CardState = z.infer<typeof CardStateEnum>;

// Rating enum - matches ts-fsrs Rating enum
export const RatingEnum = z.enum(["Again", "Hard", "Good", "Easy"]);
export type Rating = z.infer<typeof RatingEnum>;

/** A user's spaced-repetition state for one flashcard: the `flashcard_study` row. */
export const FlashcardStudySchema = z.object({
  id: z.number().int(),
  flashcardId: z.number().int(),
  deckId: z.number().int(),
  userId: z.uuid(),
  due: WireDate,
  stability: z.number(),
  difficulty: z.number(),
  elapsedDays: z.number(),
  scheduledDays: z.number(),
  learningSteps: z.number(),
  reps: z.number(),
  lapses: z.number(),
  state: CardStateEnum,
  lastReview: NullableWireDate,
  createdAt: WireDate,
  updatedAt: WireDate,
});
export type FlashcardStudy = z.infer<typeof FlashcardStudySchema>;

/**
 * Just the columns a scheduling run can change. Identity and audit columns are
 * the database's business, not the scheduler's, so they are omitted here.
 */
export const ScheduledStateSchema = FlashcardStudySchema.omit({
  id: true,
  flashcardId: true,
  deckId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type ScheduledState = z.infer<typeof ScheduledStateSchema>;

// Card with flashcard data for study view
export const CardWithFlashcardSchema = FlashcardStudySchema.extend({
  flashcard: FlashcardSchema.pick({
    back: true,
    front: true,
    id: true,
    notes: true,
  }).extend({
    // Not a flashcard column - comes from the owning deck, needed client-side for TTS.
    language: LanguageCodeSchema,
  }),
});
export type CardWithFlashcard = z.infer<typeof CardWithFlashcardSchema>;

/** One row of `review_log`: an immutable record of a single grading. */
export const ReviewLogSchema = z.object({
  id: z.number().int(),
  flashcardStudyId: z.number().int(),
  rating: RatingEnum,
  state: CardStateEnum,
  due: WireDate,
  stability: z.number(),
  difficulty: z.number(),
  elapsedDays: z.number(),
  lastElapsedDays: z.number(),
  scheduledDays: z.number(),
  learningSteps: z.number(),
  review: WireDate,
  createdAt: WireDate,
});
export type ReviewLog = z.infer<typeof ReviewLogSchema>;

export const ReviewLogEntrySchema = ReviewLogSchema.omit({
  id: true,
  flashcardStudyId: true,
  createdAt: true,
});
export type ReviewLogEntry = z.infer<typeof ReviewLogEntrySchema>;

// Scheduling info for a single rating option
export const SchedulingInfoSchema = z.object({
  rating: RatingEnum,
  nextReviewInterval: z.string(),
  scheduledDays: z.number(),
  card: ScheduledStateSchema,
});
export type SchedulingInfo = z.infer<typeof SchedulingInfoSchema>;

// Study card item with scheduling options
export const StudyCardItemSchema = z.object({
  card: CardWithFlashcardSchema,
  schedulingOptions: z.array(SchedulingInfoSchema),
});
export type StudyCardItem = z.infer<typeof StudyCardItemSchema>;

// Study session response (batch)
export const StudySessionSchema = z.object({
  cards: z.array(StudyCardItemSchema),
  sessionProgress: z.object({
    reviewed: z.number(),
    remaining: z.number(),
    total: z.number(),
  }),
});
export type StudySession = z.infer<typeof StudySessionSchema>;

// Due cards count response
export const DueCardsCountSchema = z.object({
  dueCount: z.number(),
  newCount: z.number(),
  reviewCount: z.number(),
});
export type DueCardsCount = z.infer<typeof DueCardsCountSchema>;

// Submit review response
export const SubmitReviewResponseSchema = z.object({
  success: z.boolean(),
  updatedCard: FlashcardStudySchema,
  reviewLog: ReviewLogSchema,
});
export type SubmitReviewResponse = z.infer<typeof SubmitReviewResponseSchema>;
