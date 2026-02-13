"use client";

import React, { useEffect, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDeck } from "@/lib/flashcards";
import { getLanguageByCode } from "@/lib/languages";
import { Deck } from "@/types/deck";
import { LanguageCode, targetLanguages } from "@/types/languages";

interface ImportDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decks: Deck[];
  language?: LanguageCode;
  flashcardCount: number;
  onConfirm: (deckId: number) => void;
  isLoading: boolean;
}

const CREATE_NEW_DECK_VALUE = "__create_new__";

export function ImportDeckDialog({
  open,
  onOpenChange,
  decks,
  language,
  flashcardCount,
  onConfirm,
  isLoading,
}: ImportDeckDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<
    LanguageCode | undefined
  >(language);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  const isCreatingNew = selectedOption === CREATE_NEW_DECK_VALUE;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      // Default to the user's default deck if available
      const defaultDeck = decks.find((d) => d.isDefault);
      setSelectedOption(defaultDeck ? defaultDeck.id.toString() : "");
      setNewDeckName("");
      setNewDeckDescription("");
      setSelectedLanguage(language);
    }
  }, [open, decks, language]);

  const handleConfirm = async () => {
    if (isCreatingNew) {
      if (!newDeckName.trim()) return;

      setIsCreatingDeck(true);
      try {
        const newDeck = await createDeck({
          name: newDeckName.trim(),
          language: selectedLanguage,
          description: newDeckDescription.trim() || undefined,
          visibility: "private",
        });
        onConfirm(newDeck.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create deck";
        toast.error(message);
      } finally {
        setIsCreatingDeck(false);
      }
    } else {
      const deckId = parseInt(selectedOption, 10);
      if (isNaN(deckId)) return;
      onConfirm(deckId);
    }
  };

  const isConfirmDisabled =
    isLoading ||
    isCreatingDeck ||
    !selectedOption ||
    (isCreatingNew && !newDeckName.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Flashcards</DialogTitle>
          <DialogDescription>
            Choose a deck to import {flashcardCount} flashcard
            {flashcardCount !== 1 ? "s" : ""} into, or create a new deck.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deck-select">Select Deck</Label>
            <Select.Root
              value={selectedOption}
              onValueChange={setSelectedOption}
            >
              <Select.Trigger
                id="deck-select"
                className="inline-flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <Select.Value placeholder="Select a deck" />
                <Select.Icon>
                  <ChevronDownIcon className="h-4 w-4 opacity-70" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md z-50">
                  <Select.Viewport className="p-1">
                    {decks.map((deck) => (
                      <Select.Item
                        key={deck.id}
                        value={deck.id.toString()}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                      >
                        <Select.ItemText>
                          {deck.name}
                          {deck.isDefault ? " (Default)" : ""}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                    <Select.Item
                      value={CREATE_NEW_DECK_VALUE}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                    >
                      <Select.ItemText>
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create new deck
                        </span>
                      </Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {isCreatingNew && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-deck-name">Deck Name</Label>
                <Input
                  id="new-deck-name"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Enter deck name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-deck-description">
                  Description (optional)
                </Label>
                <Input
                  id="new-deck-description"
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                  placeholder="Enter deck description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language-select">Language</Label>
                <Select.Root
                  value={selectedLanguage}
                  onValueChange={(value) =>
                    setSelectedLanguage(value as LanguageCode)
                  }
                >
                  <Select.Trigger
                    id="language-select"
                    className="inline-flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <Select.Value placeholder="Select a language">
                      {selectedLanguage && (
                        <span className="flex items-center gap-2">
                          <span>
                            {getLanguageByCode(selectedLanguage)?.flag}
                          </span>
                          <span>
                            {getLanguageByCode(selectedLanguage)?.name}
                          </span>
                        </span>
                      )}
                    </Select.Value>
                    <Select.Icon>
                      <ChevronDownIcon className="h-4 w-4 opacity-70" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md z-50">
                      <Select.Viewport className="p-1">
                        {targetLanguages.map((lang) => (
                          <Select.Item
                            key={lang.code}
                            value={lang.code}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                          >
                            <Select.ItemText>
                              <span className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                              </span>
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || isCreatingDeck}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirmDisabled}>
            {isCreatingDeck ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Deck...
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
