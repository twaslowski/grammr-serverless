import { FlashcardList } from "@/components/flashcard";
import { PageLayout } from "@/components/page-header";

export default async function FlashcardsPage() {
  return (
    <PageLayout
      header={{
        title: "Flashcards",
        description:
          "Review and manage your flashcards. Add new cards from translations or inflection tables.",
      }}
    >
      <div className="w-full">
        <FlashcardList />
      </div>
    </PageLayout>
  );
}
