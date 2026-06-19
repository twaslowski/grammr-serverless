import { Metadata } from "next";

import { PageLayout } from "@/components/page-header";
import { StudySession } from "@/components/study";

export const metadata: Metadata = {
  title: "Study | Grammr",
  description: "Review your flashcards with spaced repetition",
};

// todo: there is a ui regression where the study session page is not as wide as it should be. fix.
export default function StudyPage() {
  return (
    <PageLayout
      header={{
        title: "Study Session",
        description: "Review your flashcards",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <StudySession />
    </PageLayout>
  );
}
