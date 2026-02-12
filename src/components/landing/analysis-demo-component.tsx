import React from "react";

import { WordDetailsDialogDemo } from "@/components/landing/word-details-dialog-demo";
import { stripPunctuation } from "@/lib/morphology";
import { cn } from "@/lib/utils";
import { EnrichedMorphologicalAnalysis } from "@/types/morphology";

interface AnalysisDemoProps {
  analysis: EnrichedMorphologicalAnalysis;
  textStyle?: string;
}

export function AnalysisDemo({ analysis, textStyle }: AnalysisDemoProps) {
  return (
    <div className="flex flex-row flex-wrap px-2 gap-x-1">
      {analysis.text.split(/(\s+)/).map((segment, index) => {
        // If the segment is whitespace, just render it
        if (/^\s+$/.test(segment)) {
          return <span key={index}>{segment}</span>;
        }

        const matchingToken = analysis.tokens.find(
          (token) => token.text === stripPunctuation(segment),
        );
        if (!matchingToken) {
          console.warn(
            "could not find token for segment: ",
            stripPunctuation(segment),
          );
        }

        // If it's a word (possibly with punctuation), make it interactive
        if (segment.trim() && matchingToken) {
          return (
            <WordDetailsDialogDemo
              key={index}
              word={stripPunctuation(segment)}
              morphology={matchingToken}
              paradigm={matchingToken.paradigm}
              translation={matchingToken.translation}
              trigger={
                <p className={cn("cursor-pointer", textStyle)}>{segment}</p>
              }
            />
          );
        } else {
          return <span key={index}>{segment}</span>;
        }
      })}
    </div>
  );
}
