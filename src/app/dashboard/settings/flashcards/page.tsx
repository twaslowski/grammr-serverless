"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { DeckManagement } from "@/components/flashcards/deck-management";
import { FlashcardImportExport } from "@/components/flashcards/import-export";
import { PageLayout } from "@/components/page-header";
import { getDecks } from "@/lib/flashcards";
import { Deck } from "@/types/deck";

export default function FlashcardImportExportPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);

  useEffect(() => {
    void fetchDecks();
  }, []);

  const fetchDecks = async () => {
    setIsLoadingDecks(true);
    try {
      const data = await getDecks();
      setDecks(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch decks";
      toast.error(message);
    } finally {
      setIsLoadingDecks(false);
    }
  };

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
      <DeckManagement
        decks={decks}
        isLoadingDecks={isLoadingDecks}
        onRefresh={fetchDecks}
      />
      <FlashcardImportExport onImportComplete={fetchDecks} />
    </PageLayout>
  );
}
