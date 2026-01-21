"use client";

import React from "react";

interface StudyProgressProps {
  reviewed: number;
  remaining: number;
  total: number;
}

export function StudyProgress({
  reviewed,
  remaining,
  total,
}: StudyProgressProps) {
  const progressPercent = total > 0 ? (reviewed / total) * 100 : 0;

  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>{reviewed} reviewed</span>
        <span>{remaining} remaining</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
