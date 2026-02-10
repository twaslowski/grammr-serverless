"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useProfile } from "@/components/dashboard/profile-provider";
import { DeckItem } from "@/components/flashcards/deck-item";
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
  stopStudyingDeck,
  studyDeck,
  updateDeck,
} from "@/lib/flashcards";
import { Deck } from "@/types/deck";

interface DeckManagementProps {
  decks: Deck[];
  isLoadingDecks: boolean;
  onRefresh: () => Promise<void>;
}

export function DeckManagement({
  decks,
  isLoadingDecks,
  onRefresh,
}: DeckManagementProps) {
  const profile = useProfile();
  const confirm = useConfirm();

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
        await onRefresh();
      },
    });
  };

  const handleStudyDeck = async (deck: Deck) => {
    try {
      await studyDeck(deck.id);
      toast.success(`Started studying "${deck.name}"!`);
      await onRefresh();
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
        await onRefresh();
      },
    });
  };

  const handleRenameDeck = async (
    deck: Deck,
    newName: string,
    newDescription: string,
  ) => {
    await updateDeck(deck.id, { name: newName, description: newDescription });
    await onRefresh();
  };

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Deck Management</h2>

        <Card>
          <CardHeader>
            <CardTitle>Your Decks</CardTitle>
            <CardDescription>
              Manage your flashcard decks. You can edit and delete decks you own
              (except the default deck) and study or stop studying public decks
              created by others.
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

                  return (
                    <DeckItem
                      key={deck.id}
                      deck={deck}
                      isOwner={isOwner}
                      onDelete={handleDeleteDeck}
                      onStudy={handleStudyDeck}
                      onStopStudying={handleStopStudyingDeck}
                      onRename={handleRenameDeck}
                    />
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
