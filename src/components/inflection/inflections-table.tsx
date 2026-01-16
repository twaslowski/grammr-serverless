"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Paradigm,
  Inflection,
  isNounLike,
  isVerbLike,
  CASE_ORDER,
  CASE_LABELS,
  PERSON_ORDER,
  PERSON_LABELS,
} from "@/types/inflections";
import { CreateFlashcardDialog } from "@/components/flashcard";
import { TTSButton } from "@/components/tts/tts-button";

interface InflectionsTableProps {
  paradigm: Paradigm;
  displayAddFlashcard?: boolean;
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
  displayAddFlashcard = true,
}: InflectionsTableProps) {
  const { partOfSpeech, lemma } = paradigm;

  if (isNounLike(partOfSpeech)) {
    return (
      <NounLikeTable
        paradigm={paradigm}
        displayAddFlashcard={displayAddFlashcard}
      />
    );
  }

  if (isVerbLike(partOfSpeech)) {
    return (
      <VerbLikeTable
        paradigm={paradigm}
        displayAddFlashcard={displayAddFlashcard}
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

function NounLikeTable({
  paradigm,
  displayAddFlashcard,
}: InflectionsTableProps) {
  const { partOfSpeech, lemma, inflections } = paradigm;
  const posLabel = partOfSpeech === "NOUN" ? "Noun" : "Adjective";

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-xl">{lemma}</CardTitle>
          <p className="text-sm text-muted-foreground">{posLabel}</p>
        </div>
        {displayAddFlashcard && (
          <CreateFlashcardDialog
            front={lemma}
            type="word"
            translation=""
            paradigm={paradigm}
          />
        )}
      </CardHeader>
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
}: InflectionsTableProps) {
  const { partOfSpeech, lemma, inflections } = paradigm;
  const posLabel = partOfSpeech === "VERB" ? "Verb" : "Auxiliary Verb";

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div className="flex items-center gap-2">
          <div>
            <CardTitle className="text-xl">{lemma}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {posLabel} (Infinitive)
            </p>
          </div>
          <TTSButton text={lemma} />
        </div>
        {displayAddFlashcard && (
          <CreateFlashcardDialog
            front={lemma}
            type="word"
            translation=""
            paradigm={paradigm}
          />
        )}
      </CardHeader>
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
