import { Metadata } from "next";

import { StudySession } from "@/components/study";

export const metadata: Metadata = {
  title: "Study | grammr",
  description: "Review your flashcards with spaced repetition",
};

/**
 * The app opens on the thing you came to do.
 *
 * This used to be a grid of navigation cards — a menu standing between the
 * reader and every feature. The tab bar is that menu now, so the landing tab
 * is the study session itself.
 */
export default function StudyTabPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
      <h1 className="sr-only">Study</h1>
      <StudySession />
    </div>
  );
}
