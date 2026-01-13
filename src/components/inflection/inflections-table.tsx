"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InflectionsResponse,
  Inflection,
  isNounLike,
  isVerbLike,
  CASE_ORDER,
  CASE_LABELS,
  PERSON_ORDER,
  PERSON_LABELS,
} from "@/types/inflections";

interface InflectionsTableProps {
  response: InflectionsResponse;
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

export function InflectionsTable({ response }: InflectionsTableProps) {
  const { partOfSpeech, lemma, inflections } = response;

  if (isNounLike(partOfSpeech)) {
    return (
      <NounLikeTable
        lemma={lemma}
        inflections={inflections}
        pos={partOfSpeech}
      />
    );
  }

  if (isVerbLike(partOfSpeech)) {
    return (
      <VerbLikeTable
        lemma={lemma}
        inflections={inflections}
        pos={partOfSpeech}
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

interface TableProps {
  lemma: string;
  inflections: Inflection[];
  pos: string;
}

function NounLikeTable({ lemma, inflections, pos }: TableProps) {
  const posLabel = pos === "NOUN" ? "Noun" : "Adjective";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{lemma}</CardTitle>
        <p className="text-sm text-muted-foreground">{posLabel}</p>
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

function VerbLikeTable({ lemma, inflections, pos }: TableProps) {
  const posLabel = pos === "VERB" ? "Verb" : "Auxiliary Verb";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{lemma}</CardTitle>
        <p className="text-sm text-muted-foreground">{posLabel} (Infinitive)</p>
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
