"use client";

import React, { useState } from "react";
import { AlertCircle, Layers, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TranslationInput } from "@/components/ui/translation-input";
import { createFlashcard } from "@/lib/flashcards";
import { Flashcard, FlashcardBack } from "@/types/flashcards";

interface CreateFlashcardDialogProps {
  front: string;
  back: FlashcardBack;
  onCreated?: (flashcard: Flashcard) => void;
  trigger?: React.ReactNode;
}

export function CreateFlashcardDialog({
  front: initialFront = "",
  back: flashcardBack,
  onCreated,
  trigger,
}: CreateFlashcardDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [front, setFront] = useState<string>(initialFront);
  const [translation, setTranslation] = useState<string>(
    flashcardBack.translation,
  );

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFront(initialFront);
      setTranslation(flashcardBack.translation);
      setNotes("");
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const flashcard = await createFlashcard({
        front,
        back: { ...flashcardBack, translation: translation },
        notes: notes || undefined,
      });

      toast.success("Flashcard created!");
      setOpen(false);
      onCreated?.(flashcard);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create flashcard";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-1">
      <Layers className="h-4 w-4" />
      <Plus className="h-4 w-4" />
    </Button>
  );

  const canSubmit = front && front.trim() && translation && translation.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Flashcard</DialogTitle>
          <DialogDescription>
            Save to your deck for later study.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex flex-row gap-x-2">
                <Label htmlFor="front">Front (Word/Phrase)</Label>
              </div>
              <Input
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter word or phrase..."
                readOnly={true}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-row gap-x-2">
                <Label htmlFor="translation">Back (Translation)</Label>
              </div>
              <TranslationInput
                value={translation}
                onChange={setTranslation}
                className="w-full"
                textToTranslate={front}
                disabled={isLoading}
                placeholder="Enter translation..."
              />
            </div>
            {flashcardBack.type === "word" && (
              <div className="space-y-2">
                <Label>Inflections</Label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                  {flashcardBack.paradigm.inflections.length} inflection(s) will
                  be saved
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                disabled={isLoading}
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-destructive mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !canSubmit}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Flashcard"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
