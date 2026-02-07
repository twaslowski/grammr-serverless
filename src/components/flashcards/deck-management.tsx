"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { deleteDeck, getDecks } from "@/lib/flashcards";
import { Deck } from "@/types/flashcards";

export function DeckManagement() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDeck(deckToDelete.id);
      toast.success(`Deck "${deckToDelete.name}" deleted successfully!`);
      setDeckToDelete(null);
      await fetchDecks(); // Refresh the deck list
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete deck";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // todo: indicate read-only decks cannot be deleted, only un-studied
  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Deck Management</h2>

        <Card>
          <CardHeader>
            <CardTitle>Your Decks</CardTitle>
            <CardDescription>
              Manage your flashcard decks. You can delete decks you no longer
              need (except the default deck).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDecks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : decks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No decks found
              </p>
            ) : (
              <div className="space-y-2">
                {decks.map((deck) => (
                  <div
                    key={deck.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {deck.name}
                        {deck.isDefault && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Default)
                          </span>
                        )}
                      </h3>
                      {deck.description && (
                        <p className="text-sm text-muted-foreground">
                          {deck.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeckToDelete(deck)}
                      disabled={deck.isDefault}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <ConfirmationDialog
        open={!!deckToDelete}
        onClose={() => setDeckToDelete(null)}
        onConfirm={handleDeleteDeck}
        title="Delete Deck"
        description={
          <>
            Are you sure you want to delete &quot;{deckToDelete?.name}&quot;?
            This action cannot be undone and will delete all flashcards in this
            deck.
          </>
        }
        confirmText="Delete"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </>
  );
}
