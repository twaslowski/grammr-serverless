import { pgEnum } from "drizzle-orm/pg-core";

export const cardState = pgEnum("card_state", [
  "New",
  "Learning",
  "Review",
  "Relearning",
]);
export const rating = pgEnum("rating", ["Again", "Hard", "Good", "Easy"]);

export const deckVisibilityEnum = pgEnum("deck_visibility", [
  "private",
  "public",
  "unlisted",
]);
