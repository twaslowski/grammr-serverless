import {Flashcard, ParadigmFlashcardBack} from "@/types/flashcards";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeftRight, Edit2, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { updateFlashcard } from "@/lib/flashcards";
import toast from "react-hot-toast";

interface UpdateFlashcardDialogProps {
  flashcard: Flashcard;
  onUpdate?: (updatedFlashcard: Flashcard) => void;
}

export function UpdateFlashcardDialog({
  flashcard,
  onUpdate,
}: UpdateFlashcardDialogProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(flashcard.front);
  const [translation, setTranslation] = useState(flashcard.back.translation);
  const [notes, setNotes] = useState(flashcard.notes || "");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paradigm = flashcard.back.paradigm;

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFront(flashcard.front);
      setTranslation(flashcard.back.translation);
      setNotes(flashcard.notes || "");
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Reading response is not required, success can be derived from error or lack thereof
      await updateFlashcard(flashcard.id, {
        front,
        back: { translation, paradigm, type: flashcard.back.type } as ParadigmFlashcardBack,
        notes,
      });

      // Notify parent component of the update
      if (onUpdate) {
        onUpdate({
          ...flashcard,
          front,
          back: { translation, paradigm, type: flashcard.back.type },
          notes,
        });
      }

      toast.success("Flashcard updated!");
      setOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create flashcard";
      setError(message);
      toast.error("An error occured while updating the flashcard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    const oldFront = front;
    setFront(translation);
    setTranslation(oldFront);
  };

  // const canCreateInflections = front.split(/(\s+)/).length === 1;
  const canSubmit = front && front.trim() && translation && translation.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`edit-flashcard-${flashcard.id}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Flashcard</DialogTitle>
          <DialogDescription>Edit this flashcard</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="flex flex-row space-x-2">
                <Label htmlFor="front">Front (Word/Phrase)</Label>
                <Button
                  type="button"
                  onClick={handleSwap}
                  className="h-4 w-4 p-2"
                  variant="ghost"
                >
                  <ArrowLeftRight />
                </Button>
              </div>
              <Input
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter word or phrase..."
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-row space-x-2">
                <Label htmlFor="translation">Translation</Label>
                <Button
                  type="button"
                  onClick={handleSwap}
                  className="h-4 w-4 p-2"
                  variant="ghost"
                >
                  <ArrowLeftRight />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="translation"
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="Enter translation..."
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
            </div>
            {paradigm && paradigm.inflections.length > 0 && (
              <div className="space-y-2">
                <Label>Inflections</Label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                  {paradigm.inflections.length} inflections
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
          {/* todo: find a mechanism to add inflections to an existing flashcard.
            needs to implement guardrails, language check or strong error handling/user explanation/instruction */}
          {/*{!paradigm && canCreateInflections && (*/}
          {/*  <div className="space-y-2">*/}
          {/*    <Label>Inflections</Label>*/}
          {/*    <div className="flex flex-row justify-between bg-muted rounded-md p-2">*/}
          {/*      <p className="text-sm text-muted-foreground">*/}
          {/*        Generate inflections*/}
          {/*      </p>*/}
          {/*      <Button*/}
          {/*        type="button"*/}
          {/*        variant="outline"*/}
          {/*        className="h-4 w-4"*/}
          {/*        onClick={handleFetchInflection}*/}
          {/*        disabled={isLoading || isLoading}*/}
          {/*        title="Fetch translation"*/}
          {/*      >*/}
          {/*        {isLoading ? (*/}
          {/*          <Loader2 className="h-4 w-4 animate-spin" />*/}
          {/*        ) : (*/}
          {/*          <Sparkles className="h-4 w-4" />*/}
          {/*        )}*/}
          {/*      </Button>*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*)}*/}
          <div className="pb-4" />
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
                  Updating...
                </>
              ) : (
                "Update Flashcard"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
