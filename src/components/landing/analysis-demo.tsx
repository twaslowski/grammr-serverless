"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import analysisData from "@/../public/analysis.json";
import { AnalysisDemo as AnalysisDemoComponent } from "@/components/landing/analysis-demo-component";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrichedMorphologicalAnalysis } from "@/types/morphology";

export function AnalysisDemo() {
  return (
    <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="flex flex-col gap-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            See It In Action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Click on any word below to explore its grammatical features,
            inflections, and translations. This is what makes learning
            systematic.
          </p>
        </div>

        {/* Analysis Display */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Interactive Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click any word to see detailed grammatical information
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Original Text with Analysis */}
            <div className="p-4 rounded-lg border bg-background">
              <p className="text-sm text-muted-foreground mb-3">
                Russian sentence:
              </p>
              <AnalysisDemoComponent
                analysis={analysisData.back as EnrichedMorphologicalAnalysis}
                textStyle="text-xl"
              />
            </div>

            {/* Translation */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">Translation:</p>
              <p className="text-lg leading-relaxed">
                {analysisData.back.translation}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="items-center flex gap-x-4">
          <p className="text-muted-foreground">
            Ready to start your language learning journey?
          </p>
          <Link href="/auth/sign-up">
            <div className="flex flex-row items-center">
              Sign Up
              <ArrowRight />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
