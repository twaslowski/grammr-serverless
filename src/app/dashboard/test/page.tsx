"use client";

import React, { useState } from "react";
import { PageLayout } from "@/components/page-header";
import { WordDetailsDialogFull } from "@/components/translation/word-details-dialog-full";
import { ParadigmSchema, PartOfSpeechEnum } from "@/types/inflections";
import { z } from "zod";
import { FeatureSchema } from "@/types/feature";

const NewTypeSchema = z.object({
  source_phrase: z.string(),
  tokens: z.array(
    z.object({
      text: z.string(),
      lemma: z.string(),
      pos: z.string().pipe(PartOfSpeechEnum).catch("X"),
      features: z.array(FeatureSchema).default([]),
      paradigm: ParadigmSchema.optional(),
    }),
  ),
});
type NewType = z.infer<typeof NewTypeSchema>;

export default function TestPage() {
  // State for JSON input and parsed object
  const [jsonInput, setJsonInput] = useState("");
  const [parsed, setParsed] = useState<NewType | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    try {
      const obj = JSON.parse(e.target.value);
      const p = NewTypeSchema.safeParse(obj);
      if (p.success) {
        setParsed(p.data);
      } else {
        setError(p.error.message);
      }
    } catch {
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
        <div className="flex flex-row gap-x-2">
          {parsed?.tokens &&
            parsed.tokens.map((t, index) => (
              <WordDetailsDialogFull
                key={index}
                word={t.text}
                translation={""}
                morphology={t || {}}
                paradigm={t.paradigm}
                trigger={<p className="cursor-pointer">{t.text}</p>}
              />
            ))}
        </div>
      </>
    </PageLayout>
  );
}
