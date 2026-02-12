"use client";

import { CreateFlashcardDialog } from "@/components/flashcard";
import { TTSButton } from "@/components/tts/tts-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPosLabel } from "@/lib/feature-labels";
import {
  CASE_LABELS,
  CASE_ORDER,
  Inflection,
  isNounLike,
  isVerbLike,
  Paradigm,
  PERSON_LABELS,
  PERSON_ORDER,
} from "@/types/inflections";

interface InflectionsTableProps {
  paradigm: Paradigm;
  displayAddFlashcard?: boolean;
  displayTTSButton?: boolean;
  displayHeader?: boolean;
}

// Helper to find an inflection by its features
function findInflection(
  inflections: Inflection[],
  targetFeatures: Record<string, string>,
): Inflection | undefined {
  return inflections.find((inf) => {
    return Object.entries(targetFeatures).every(([type, value]) =>
      inf.features.some((f) => f.type === type && f.value === value),
    );
  });
}

export function InflectionsTable({
  paradigm,
  displayTTSButton = true,
  displayAddFlashcard = true,
  displayHeader = true,
}: InflectionsTableProps) {
  const { partOfSpeech, lemma } = paradigm;

  if (isNounLike(partOfSpeech)) {
    return (
      <NounLikeTable
        paradigm={paradigm}
        displayTTSButton={displayTTSButton}
        displayAddFlashcard={displayAddFlashcard}
        displayHeader={displayHeader}
      />
    );
  }

  if (isVerbLike(partOfSpeech)) {
    return (
      <VerbLikeTable
        paradigm={paradigm}
        displayTTSButton={displayTTSButton}
        displayAddFlashcard={displayAddFlashcard}
        displayHeader={displayHeader}
      />
    );
  }

  // Fallback for unknown POS
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{lemma}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Part of speech: {partOfSpeech}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Inflection table not available for this part of speech.
        </p>
      </CardContent>
    </Card>
  );
}

function InflectionsTableHeader({
  paradigm,
  displayTTSButton,
  displayAddFlashcard,
}: InflectionsTableProps) {
  const { partOfSpeech, lemma } = paradigm;

  return (
    <CardHeader className="flex flex-row justify-between items-start">
      <div>
        <CardTitle className="text-xl">{lemma}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getPosLabel(partOfSpeech)}
        </p>
      </div>
      <div className="flex gap-x-2">
        {displayTTSButton && <TTSButton text={lemma} />}
        {displayAddFlashcard && (
          <CreateFlashcardDialog
            front={lemma}
            back={{
              type: "word",
              paradigm: paradigm,
              translation: "",
            }}
          />
        )}
      </div>
    </CardHeader>
  );
}

function NounLikeTable({
  paradigm,
  displayTTSButton,
  displayAddFlashcard,
  displayHeader,
}: InflectionsTableProps) {
  const { inflections } = paradigm;

  return (
    <Card>
      {displayHeader && (
        <InflectionsTableHeader
          paradigm={paradigm}
          displayTTSButton={displayTTSButton}
          displayAddFlashcard={displayAddFlashcard}
        />
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Case</th>
                <th className="text-left py-2 px-3 font-medium">Singular</th>
                <th className="text-left py-2 px-3 font-medium">Plural</th>
              </tr>
            </thead>
            <tbody>
              {CASE_ORDER.map((caseValue) => {
                const singular = findInflection(inflections, {
                  CASE: caseValue,
                  NUMBER: "SING",
                });
                const plural = findInflection(inflections, {
                  CASE: caseValue,
                  NUMBER: "PLUR",
                });

                return (
                  <tr key={caseValue} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium text-muted-foreground">
                      {CASE_LABELS[caseValue]}
                    </td>
                    <td className="py-2 px-3">{singular?.inflected || "—"}</td>
                    <td className="py-2 px-3">{plural?.inflected || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function VerbLikeTable({
  paradigm,
  displayAddFlashcard,
  displayTTSButton,
  displayHeader,
}: InflectionsTableProps) {
  const { inflections } = paradigm;

  return (
    <Card>
      {displayHeader && (
        <InflectionsTableHeader
          paradigm={paradigm}
          displayTTSButton={displayTTSButton}
          displayAddFlashcard={displayAddFlashcard}
        />
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Person</th>
                <th className="text-left py-2 px-3 font-medium">Singular</th>
                <th className="text-left py-2 px-3 font-medium">Plural</th>
              </tr>
            </thead>
            <tbody>
              {PERSON_ORDER.map((personValue) => {
                const singular = findInflection(inflections, {
                  PERSON: personValue,
                  NUMBER: "SING",
                });
                const plural = findInflection(inflections, {
                  PERSON: personValue,
                  NUMBER: "PLUR",
                });

                return (
                  <tr key={personValue} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium text-muted-foreground">
                      {PERSON_LABELS[personValue]}
                    </td>
                    <td className="py-2 px-3">{singular?.inflected || "—"}</td>
                    <td className="py-2 px-3">{plural?.inflected || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
