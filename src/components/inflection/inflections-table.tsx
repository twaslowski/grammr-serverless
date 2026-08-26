"use client";

import { CreateFlashcardDialog } from "@/components/flashcard";
import { TTSButton } from "@/components/tts/tts-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getFeatureDisplayLabel,
  getFeatureValueLabel,
  getPosLabel,
} from "@/lib/feature-labels";
import { paradigmLayout } from "@/lib/inflections";
import {
  CASE_ORDER,
  GENDER_ORDER,
  Inflection,
  Paradigm,
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
  const shared = {
    paradigm,
    displayTTSButton,
    displayAddFlashcard,
    displayHeader,
  };

  switch (paradigmLayout(partOfSpeech)) {
    case "adjective":
      return <AdjectiveTable {...shared} />;
    case "noun":
      return <NounLikeTable {...shared} />;
    case "verb":
      return <VerbLikeTable {...shared} />;
    case "unsupported":
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
}

function InflectionsTableHeader({
  paradigm,
  displayTTSButton,
  displayAddFlashcard,
}: InflectionsTableProps) {
  const { partOfSpeech, lemma, lemmaFeatures } = paradigm;

  const subtitle = [
    getPosLabel(partOfSpeech),
    ...lemmaFeatures.map(getFeatureDisplayLabel),
  ].join(" · ");

  return (
    <CardHeader className="flex flex-row justify-between items-start">
      <div>
        <CardTitle className="text-xl">{lemma}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
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
                      {getFeatureValueLabel("CASE", caseValue)}
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

function AdjectiveTable({
  paradigm,
  displayTTSButton,
  displayAddFlashcard,
  displayHeader,
}: InflectionsTableProps) {
  const { inflections } = paradigm;

  // Paradigms produced before adjective gender was inflected have no gendered
  // forms at all. Rendering them here would leave every gender column empty,
  // so fall back to the case/number layout they were built for.
  const hasGenderedForms = inflections.some((inf) =>
    inf.features.some((f) => f.type === "GENDER"),
  );

  if (!hasGenderedForms) {
    return (
      <NounLikeTable
        paradigm={paradigm}
        displayTTSButton={displayTTSButton}
        displayAddFlashcard={displayAddFlashcard}
        displayHeader={displayHeader}
      />
    );
  }

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
                {GENDER_ORDER.map((genderValue) => (
                  <th
                    key={genderValue}
                    className="text-left py-2 px-3 font-medium"
                  >
                    {getFeatureValueLabel("GENDER", genderValue)}
                  </th>
                ))}
                <th className="text-left py-2 px-3 font-medium">Plural</th>
              </tr>
            </thead>
            <tbody>
              {CASE_ORDER.map((caseValue) => {
                // Russian adjectives do not distinguish gender in the plural,
                // so it gets a single column rather than three.
                const plural = findInflection(inflections, {
                  CASE: caseValue,
                  NUMBER: "PLUR",
                });

                return (
                  <tr key={caseValue} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium text-muted-foreground">
                      {getFeatureValueLabel("CASE", caseValue)}
                    </td>
                    {GENDER_ORDER.map((genderValue) => {
                      const singular = findInflection(inflections, {
                        CASE: caseValue,
                        NUMBER: "SING",
                        GENDER: genderValue,
                      });

                      return (
                        <td key={genderValue} className="py-2 px-3">
                          {singular?.inflected || "—"}
                        </td>
                      );
                    })}
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
                      {getFeatureValueLabel("PERSON", personValue)}
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
