"use client";

import { useState } from "react";
import { PageLayout } from "@/components/page-header";
import { WordDetailsDialogFull } from "@/components/translation/word-details-dialog-full";
import {TokenMorphology} from "@/types/morphology";
import {Paradigm} from "@/types/inflections";

export default function TestPage() {
  // State for JSON input and parsed object
  const [jsonInput, setJsonInput] = useState("");
  const [parsed, setParsed] = useState<{ morphology: TokenMorphology; paradigm: Paradigm, word: string, translation: string } | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    try {
      const obj = JSON.parse(e.target.value);
      setParsed({
        morphology: obj.morphology as TokenMorphology,
        paradigm: obj.paradigm as Paradigm,
        translation: obj.translation,
        word: obj.word
      });
      setError(null);
    } catch (err) {
      setError("Invalid JSON");
    }
  };

  return (
    <PageLayout
      header={{
        title: "Testing",
        description: "Congrats, you found the test playground!",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <>
        <div style={{ margin: "1em 0" }}>
          <label htmlFor="json-input">
            Paste JSON for morphology/paradigm:
          </label>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={handleJsonChange}
            rows={6}
            style={{ width: "100%" }}
            placeholder='{ "morphology": {...}, "paradigm": {...} }'
          />
          {error && <div style={{ color: "red" }}>{error}</div>}
        </div>
        {parsed && (
          <WordDetailsDialogFull
            word={parsed.word}
            translation={parsed.translation}
            morphology={parsed.morphology || {}}
            paradigm={parsed.paradigm || {}}
          />
        )}
      </>
    </PageLayout>
  );
}
