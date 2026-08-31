import React from "react";

import { Analysis } from "@/components/flashcard/analysis";
import { InflectionsTable } from "@/components/inflection";
import { FlashcardBack } from "@/types/flashcards";

export interface CardDetail {
  /** What the disclosure is called, e.g. "Forms". */
  label: string;
  /** How many things are behind it, shown next to the label. */
  count: number;
  render: () => React.ReactNode;
}

/**
 * The one place that decides what extra detail a card has.
 *
 * Before this, a `word` card got a "View Inflections (N)" button, an
 * `analysis` card got nothing despite having a full per-token breakdown behind
 * it, and on the study screen the `word` lemma was itself a dialog trigger
 * with nothing to say so. Three back types, three different answers to the
 * same question.
 *
 * Returning `null` for `phrase` is the honest answer rather than an omission:
 * a phrase card genuinely has nothing more to show, and the callers render no
 * trigger at all instead of one that opens onto an apology.
 */
export function cardDetail(back: FlashcardBack): CardDetail | null {
  switch (back.type) {
    case "word":
      return {
        label: "Forms",
        count: back.paradigm.inflections.length,
        render: () => (
          <InflectionsTable
            paradigm={back.paradigm}
            displayHeader={false}
            displayAddFlashcard={false}
          />
        ),
      };
    case "analysis":
      return {
        label: "Breakdown",
        count: back.tokens.length,
        render: () => <Analysis analysis={back} />,
      };
    case "phrase":
      return null;
  }
}
