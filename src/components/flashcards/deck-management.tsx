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
import { useConfirm } from "@/components/ui/confirmation-provider";
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

  const profile = useProfile();
  const confirm = useConfirm();

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

  const handleDeleteDeck = async (deck: Deck) => {
    confirm({
      title: "Delete Deck",
      description: (
        <>
          Are you sure you want to delete &quot;{deck.name}&quot;? This action
          cannot be undone and will delete all flashcards in this deck.
        </>
      ),
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        await deleteDeck(deck.id);
        toast.success(`Deck "${deck.name}" deleted successfully!`);
        await fetchDecks();
      },
    });
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

  const handleStopStudyingDeck = async (deck: Deck) => {
    confirm({
      title: "Stop Studying Deck",
      description: (
        <>
          Are you sure you want to stop studying &quot;{deck.name}&quot;? This
          will remove all your progress for flashcards in this deck.
        </>
      ),
      confirmText: "Stop Studying",
      confirmVariant: "destructive",
      onConfirm: async () => {
        await stopStudyingDeck(deck.id);
        toast.success(`Stopped studying "${deck.name}"!`);
        await fetchDecks();
      },
    });
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
                                ? handleStopStudyingDeck(deck)
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
                            onClick={() => handleDeleteDeck(deck)}
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
    </>
  );
}
