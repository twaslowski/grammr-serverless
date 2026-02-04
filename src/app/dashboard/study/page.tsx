import { PageLayout } from "@/components/page-header";
import { StudySession } from "@/components/study";

export const metadata = {
  title: "Study | Grammr",
  description: "Review your flashcards with spaced repetition",
};

export default function StudyPage() {
  return (
      <PageLayout
          header={{
              title: "Study Session",
              description:
                  "Review your flashcards",
              backHref: "/dashboard",
              backLabel: "Back to Dashboard",
          }}
      >

      <StudySession />
      </PageLayout>
  );
}
