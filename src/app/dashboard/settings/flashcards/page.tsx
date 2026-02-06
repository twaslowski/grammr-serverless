import React from "react";

import { DeckManagement } from "@/components/flashcards/deck-management";
import { FlashcardImportExport } from "@/components/flashcards/import-export";
import { PageLayout } from "@/components/page-header";

export default function FlashcardImportExportPage() {
  return (
    <PageLayout
      header={{
        title: "Import & Export Flashcards",
        description:
          "Easily back up or transfer your flashcards by exporting them to a JSON file, or import flashcards from a previously exported file.",
        backHref: "/dashboard/settings",
        backLabel: "Back to settings",
      }}
    >
      <DeckManagement />
      <FlashcardImportExport />
    </PageLayout>
  );
}
