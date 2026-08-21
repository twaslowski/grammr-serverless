"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { DeckManagement } from "@/components/flashcards/deck-management";
import { FlashcardImportExport } from "@/components/flashcards/import-export";
import { PageLayout } from "@/components/page-header";
import { getDecks } from "@/lib/flashcards";
import { Deck } from "@/types/deck";

export default function FlashcardImportExportPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  // Starts true: the initial load is kicked off on mount, below.
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);

  const loadDecks = useCallback(async () => {
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
  }, []);

  useEffect(() => {
  // Effect-driven data fetching: loading/result state is set after an await.
  // The real fix is to fetch on the server and pass the data in as props.
  // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDecks();
  }, [loadDecks]);

  // Refreshes triggered by the user should show the spinner again.
  const refreshDecks = useCallback(async () => {
    setIsLoadingDecks(true);
    await loadDecks();
  }, [loadDecks]);

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
        onRefresh={refreshDecks}
      />
      <FlashcardImportExport onImportComplete={refreshDecks} />
    </PageLayout>
  );
}
