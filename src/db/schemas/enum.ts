import { pgEnum } from "drizzle-orm/pg-core";

export const deckVisibilityEnum = pgEnum("visibility", ["private", "public"]);

export const ratingEnum = pgEnum("rating", ["Again", "Hard", "Good", "Easy"]);

export const cardStateEnum = pgEnum("card_state", [
  "New",
  "Learning",
  "Review",
  "Relearning",
]);
