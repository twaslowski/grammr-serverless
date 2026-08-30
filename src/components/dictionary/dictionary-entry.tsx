"use client";

import { CreateFlashcardDialog } from "@/components/flashcard";
import { InflectionsTable } from "@/components/inflection";
import { TTSButton } from "@/components/tts/tts-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeatureDisplayValue, getPosLabel } from "@/lib/feature-labels";
import { paradigmLayout } from "@/lib/inflections";
import {
  DictionaryEntry,
  isExplicitlyUninflectable,
  toParadigm,
} from "@/types/dictionary";
import { LanguageCode } from "@/types/languages";

interface DictionaryEntryCardProps {
  entry: DictionaryEntry;
  languageCode: LanguageCode;
}

/**
 * One dictionary entry: headword, senses, and a table only if there is one.
 *
 * The table is `InflectionsTable`, reused unchanged — a dictionary paradigm is a
 * `Paradigm`, which is why `toParadigm` is a projection rather than a conversion.
 * It is rendered with `displayHeader={false}` because this card supplies a richer
 * header of its own (stressed spelling, senses).
 */
export function DictionaryEntryCard({
  entry,
  languageCode,
}: DictionaryEntryCardProps) {
  const paradigm = toParadigm(entry);

  // A paradigm whose part of speech has no table layout would render the
  // "not available for this part of speech" fallback, which is the old error
  // message in a new place. Treat it as an entry without a table.
  const renderTable =
    paradigm !== null && paradigmLayout(entry.partOfSpeech) !== "unsupported";

  const inherent = entry.lemmaFeatures
    .filter((feature) => feature.type !== "OTHER")
    .map(getFeatureDisplayValue);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          {/* An explicit heading: a result list is the one place where being
              able to jump between entries with a screen reader matters, and
              `CardTitle` is an unadorned div. */}
          <CardTitle role="heading" aria-level={2} className="text-2xl">
            {entry.accented ?? entry.lemma}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getPosLabel(entry.partOfSpeech)}</Badge>
            {inherent.map((label) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-x-2">
          {/* The unstressed form: stress marks are a reading aid, not something
              to hand to a speech synthesiser or put on a flashcard front. */}
          <TTSButton text={entry.lemma} />
          {/* The "word" back requires a paradigm -- `study-card.tsx` reads
              `back.paradigm.lemma` to render the prompt -- so an entry with no
              table is stored as a "phrase". That is not a workaround: with no
              paradigm to reveal, the two backs behave identically, and the front
              already holds the word. */}
          <CreateFlashcardDialog
            front={entry.lemma}
            back={
              paradigm
                ? {
                    type: "word",
                    paradigm,
                    translation: entry.senses[0]?.gloss ?? "",
                  }
                : {
                    type: "phrase",
                    translation: entry.senses[0]?.gloss ?? "",
                  }
            }
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Senses entry={entry} />

        {renderTable ? (
          <InflectionsTable
            paradigm={paradigm}
            displayHeader={false}
            displayTTSButton={false}
            displayAddFlashcard={false}
          />
        ) : (
          <UninflectedNote entry={entry} />
        )}

        <Attribution entry={entry} languageCode={languageCode} />
      </CardContent>
    </Card>
  );
}

function Senses({ entry }: { entry: DictionaryEntry }) {
  if (entry.senses.length === 0) {
    // Happens when the entry came from the generators rather than the artifact:
    // they produce forms, not meanings. Better to say so than to show a blank gap.
    return (
      <p className="text-sm text-muted-foreground">
        No definition available for this word yet.
      </p>
    );
  }

  return (
    <ol className="space-y-1.5">
      {entry.senses.map((sense, index) => (
        <li key={index} className="flex gap-2 text-sm">
          <span className="shrink-0 text-muted-foreground">{index + 1}.</span>
          <span>
            {sense.tags.length > 0 && (
              <em className="mr-1.5 text-muted-foreground">
                {sense.tags.join(", ")}
              </em>
            )}
            {sense.gloss}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Says, in words, that there is no table.
 *
 * The distinction matters: an adverb or a preposition has no paradigm by nature,
 * and an indeclinable noun is a fact about the word rather than a gap in the
 * data. Rendering nothing at all would read as something having gone wrong.
 */
function UninflectedNote({ entry }: { entry: DictionaryEntry }) {
  if (isExplicitlyUninflectable(entry)) {
    return (
      <p className="text-sm text-muted-foreground">
        This word is indeclinable — it keeps the same form in every case and
        number.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {getPosLabel(entry.partOfSpeech)}s do not inflect.
    </p>
  );
}

/**
 * Per-entry attribution.
 *
 * Wiktionary content is CC BY-SA, and the obligation is attribution plus a link
 * back. Rendering it from the entry's own `source` rather than as a page footer
 * keeps it correct when a result list mixes Wiktionary entries with ones the
 * generators produced, which carry no such obligation.
 */
function Attribution({
  entry,
  languageCode,
}: {
  entry: DictionaryEntry;
  languageCode: LanguageCode;
}) {
  if (entry.source !== "wiktionary" || !entry.sourceUrl) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground">
      From{" "}
      <a
        href={entry.sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="underline hover:text-foreground"
        lang={languageCode}
      >
        Wiktionary
      </a>
      , available under{" "}
      <a
        href="https://creativecommons.org/licenses/by-sa/4.0/"
        target="_blank"
        rel="noreferrer noopener"
        className="underline hover:text-foreground"
      >
        CC BY-SA 4.0
      </a>
      .
    </p>
  );
}
