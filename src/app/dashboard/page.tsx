import { Metadata } from "next";

import { StudySession } from "@/components/study";

export const metadata: Metadata = {
  title: "Study | grammr",
  description: "Review your flashcards with spaced repetition",
};

/**
 * The app opens on the thing you came to do — and, when there is nothing to do,
 * on where you stand.
 *
 * This used to be a grid of navigation cards — a menu standing between the
 * reader and every feature. The tab bar is that menu now, so the landing tab is
 * the study session itself. When no cards are due the same tab shows the
 * dashboard instead of a dead end; see `StudyDashboard`.
 *
 * `?dashboard=1` opens straight onto the idle view. It is not a debug flag: it
 * reads data the caller already owns, changes nothing, and is what makes the
 * idle state testable without first grinding a shared test account's queue down
 * to zero.
 */
export default async function StudyTabPage({
  searchParams,
}: {
  searchParams: Promise<{ dashboard?: string }>;
}) {
  const { dashboard } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
      <h1 className="sr-only">Study</h1>
      <StudySession initialView={dashboard ? "dashboard" : "session"} />
    </div>
  );
}
