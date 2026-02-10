"use client";

import React, { useEffect, useState } from "react";
import { EyeIcon, EyeOff, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { useProfile } from "@/components/dashboard/profile-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  deleteDeck,
  getDecks,
  stopStudyingDeck,
  studyDeck,
} from "@/lib/flashcards";
import { Deck } from "@/types/deck";

export function DeckManagement() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [deckToUnstudy, setDeckToUnstudy] = useState<Deck | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnstudying, setIsUnstudying] = useState(false);

  const profile = useProfile();

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

  const handleStudyDeck = async (deck: Deck) => {
    try {
      await studyDeck(deck.id);
      toast.success(`Started studying "${deck.name}"!`);
      await fetchDecks();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to start studying deck";
      toast.error(message);
    }
  };

  const handleUnstudyDeck = async () => {
    if (!deckToUnstudy) return;

    setIsUnstudying(true);
    try {
      await stopStudyingDeck(deckToUnstudy.id);
      toast.success(`Stopped studying "${deckToUnstudy.name}"!`);
      setDeckToUnstudy(null);
      await fetchDecks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to stop studying deck";
      toast.error(message);
    } finally {
      setIsUnstudying(false);
    }
  };

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Deck Management</h2>

        <Card>
          <CardHeader>
            <CardTitle>Your Decks</CardTitle>
            <CardDescription>
              Manage your flashcard decks. You can delete decks you own (except
              the default deck) and study or stop studying public decks created
              by others.
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
                {decks.map((deck) => {
                  const isOwner = deck.userId === profile.id;
                  const isStudying = deck.isStudying;

                  return (
                    <div
                      key={deck.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{deck.name}</h3>
                          {!isOwner && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              Public
                            </span>
                          )}
                        </div>
                        {deck.description && (
                          <p className="text-sm text-muted-foreground">
                            {deck.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              isStudying
                                ? setDeckToUnstudy(deck)
                                : handleStudyDeck(deck)
                            }
                            title={
                              isStudying
                                ? "Stop studying this deck"
                                : "Start studying this deck"
                            }
                          >
                            {isStudying ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeckToDelete(deck)}
                            disabled={deck.isDefault}
                            title={
                              deck.isDefault
                                ? "Cannot delete default deck"
                                : "Delete deck"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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

      <ConfirmationDialog
        open={!!deckToUnstudy}
        onClose={() => setDeckToUnstudy(null)}
        onConfirm={handleUnstudyDeck}
        title="Stop Studying Deck"
        description={
          <>
            Are you sure you want to stop studying &quot;{deckToUnstudy?.name}
            &quot;? This will remove all your progress for flashcards in this
            deck.
          </>
        }
        confirmText="Stop Studying"
        isLoading={isUnstudying}
        loadingText="Removing..."
      />
    </>
  );
}
