"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { createFlashcard } from "@/lib/flashcards";
import { FlashcardType, FlashcardBack, Flashcard } from "@/types/flashcards";
import { Inflection } from "@/types/inflections";
import toast from "react-hot-toast";

interface CreateFlashcardDialogProps {
  /** The front text (word or phrase in learned language) */
  front?: string;
  /** The type of flashcard */
  type?: FlashcardType;
  /** Pre-populated translation */
  translation?: string;
  /** Pre-populated inflections */
  inflections?: Inflection[];
  /** Optional callback when flashcard is created */
  onCreated?: (flashcard: Flashcard) => void;
  /** Custom trigger button, defaults to a Plus button */
  trigger?: React.ReactNode;
  /** Whether to show a compact trigger */
  compact?: boolean;
}

export function CreateFlashcardDialog({
  front: initialFront = "",
  type: initialType = "word",
  translation: initialTranslation = "",
  inflections: initialInflections,
  onCreated,
  trigger,
  compact = false,
}: CreateFlashcardDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [front, setFront] = useState(initialFront);
  const [translation, setTranslation] = useState(initialTranslation);
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFront(initialFront);
      setTranslation(initialTranslation);
      setNotes("");
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const back: FlashcardBack = {
        translation,
        inflections: initialInflections,
      };

      const flashcard = await createFlashcard({
        front,
        type: initialType,
        back,
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

  const defaultTrigger = compact ? (
    <Button variant="outline" size="sm" className="gap-1">
      <Plus className="h-4 w-4" />
      <span className="sr-only sm:not-sr-only">Add to Flashcards</span>
    </Button>
  ) : (
    <Button variant="outline" className="gap-2">
      <Plus className="h-4 w-4" />
      Add to Flashcards
    </Button>
  );

  const canSubmit = front.trim() && translation.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Flashcard</DialogTitle>
          <DialogDescription>
            Add this {initialType} to your flashcard deck for later study.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="front">Front (Word/Phrase)</Label>
              <Input
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter word or phrase..."
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="translation">Translation</Label>
              <Input
                id="translation"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Enter translation..."
                disabled={isLoading}
              />
              {!translation && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Translation is required
                </p>
              )}
            </div>
            {initialInflections && initialInflections.length > 0 && (
              <div className="space-y-2">
                <Label>Inflections</Label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                  {initialInflections.length} inflection(s) will be saved
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
