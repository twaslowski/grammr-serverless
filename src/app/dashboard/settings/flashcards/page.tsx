import { FlashcardImportExport } from "@/components/flashcards/import-export";
import { PageLayout } from "@/components/page-header";

export default function FlashcardDataPage() {
  return (
    <PageLayout
      header={{
        title: "Flashcard data",
        description:
          "Back your flashcards up to a JSON file, or restore them from a previous export.",
        backHref: "/dashboard/settings",
        backLabel: "Back to settings",
      }}
    >
      <FlashcardImportExport />
    </PageLayout>
  );
}
