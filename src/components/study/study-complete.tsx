"use client";

import React from "react";
import { ArrowRight, CheckCircle2, LayersIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudyCompleteProps {
  reviewed: number;
  onStudyMore?: () => void;
}

export function StudyComplete({ reviewed, onStudyMore }: StudyCompleteProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className="text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Study Session Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You reviewed{" "}
            <span className="font-bold text-foreground">{reviewed}</span>{" "}
            {reviewed === 1 ? "card" : "cards"} in this session.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {onStudyMore && (
              <Link href="/dashboard/flashcards">
                <Button variant="outline">
                  <LayersIcon />
                  Edit Flashcards
                </Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button className="gap-2">
                Back to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
