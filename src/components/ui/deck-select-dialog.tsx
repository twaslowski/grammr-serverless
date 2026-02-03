import { useState } from "react";

import type { Deck } from "@/types/flashcards";

import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";

interface DeckSelectDialogProps {
  open: boolean;
  decks: Deck[];
  onSelect: (deck: Deck) => void;
  onCreate: (name: string) => Promise<Deck>;
  onClose: () => void;
}

export function DeckSelectDialog({
  open,
  decks,
  onSelect,
  onCreate,
  onClose,
}: DeckSelectDialogProps) {
  const [newDeckName, setNewDeckName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newDeckName.trim()) {
      setError("Deck name cannot be empty");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const deck = await onCreate(newDeckName.trim());
      setNewDeckName("");
      onSelect(deck);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create deck");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Deck</DialogTitle>
          <DialogDescription>
            Choose an existing deck or create a new one to import your
            flashcards into.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {decks.map((deck) => (
            <Button
              key={deck.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSelect(deck)}
            >
              {deck.name}
            </Button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="New deck name"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            disabled={creating}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
            }}
          />
          <Button
            onClick={handleCreate}
            disabled={creating || !newDeckName.trim()}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </div>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
