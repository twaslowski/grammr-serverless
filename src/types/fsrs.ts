import { z } from "zod";

/**
 * FSRS (Free Spaced Repetition Scheduler) types
 * These types map to the ts-fsrs library interfaces and the database schema
 */

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

// Rating numeric values (for ts-fsrs compatibility)
export const RATING_VALUES = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
} as const;

// State numeric values (for ts-fsrs compatibility)
export const STATE_VALUES = {
  New: 0,
  Learning: 1,
  Review: 2,
  Relearning: 3,
} as const;

// Card schema - matches the database card table and ts-fsrs Card interface
export const CardSchema = z.object({
  id: z.number(),
  flashcard_id: z.number(),
  user_id: z.string().uuid(),
  due: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number(),
  reps: z.number(),
  lapses: z.number(),
  state: CardStateEnum,
  last_review: z
    .string()
    .or(z.date())
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Card = z.infer<typeof CardSchema>;

// Card with flashcard data for study view
export const CardWithFlashcardSchema = CardSchema.extend({
  flashcard: z.object({
    id: z.number(),
    front: z.string(),
    back: z.object({
      translation: z.string(),
      paradigm: z.any().optional(),
    }),
    notes: z.string().nullable(),
  }),
});
export type CardWithFlashcard = z.infer<typeof CardWithFlashcardSchema>;

// ReviewLog schema - matches the database review_log table and ts-fsrs ReviewLog
export const ReviewLogSchema = z.object({
  id: z.number(),
  card_id: z.number(),
  rating: RatingEnum,
  state: CardStateEnum,
  due: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number(),
  last_elapsed_days: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number(),
  review: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  created_at: z.string(),
});
export type ReviewLog = z.infer<typeof ReviewLogSchema>;

// Scheduling info for a single rating option
export const SchedulingInfoSchema = z.object({
  rating: RatingEnum,
  nextReviewInterval: z.string(), // Human readable interval (e.g., "1 day", "2 hours")
  scheduledDays: z.number(),
  card: CardSchema.omit({
    id: true,
    flashcard_id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
  }),
});
export type SchedulingInfo = z.infer<typeof SchedulingInfoSchema>;

// Study session response
export const StudySessionSchema = z.object({
  card: CardWithFlashcardSchema,
  schedulingOptions: z.array(SchedulingInfoSchema),
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

// Submit review request
export const SubmitReviewRequestSchema = z.object({
  rating: RatingEnum,
});
export type SubmitReviewRequest = z.infer<typeof SubmitReviewRequestSchema>;

// Submit review response
export const SubmitReviewResponseSchema = z.object({
  success: z.boolean(),
  updatedCard: CardSchema,
  reviewLog: ReviewLogSchema.omit({ id: true, created_at: true }),
});
export type SubmitReviewResponse = z.infer<typeof SubmitReviewResponseSchema>;
