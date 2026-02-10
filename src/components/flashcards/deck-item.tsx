"use client";

import React, { useState } from "react";
import { Edit, EyeIcon, EyeOff, Trash2 } from "lucide-react";
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
import { Deck } from "@/types/deck";

interface DeckItemProps {
  deck: Deck;
  isOwner: boolean;
  onDelete: (deck: Deck) => void;
  onStudy: (deck: Deck) => void;
  onStopStudying: (deck: Deck) => void;
  onRename: (
    deck: Deck,
    newName: string,
    newDescription: string,
  ) => Promise<void>;
}

export function DeckItem({
  deck,
  isOwner,
  onDelete,
  onStudy,
  onStopStudying,
  onRename,
}: DeckItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState(deck.name);
  const [newDeckDescription, setNewDeckDescription] = useState(
    deck.description || "",
  );
  const [isEditing, setIsEditing] = useState(false);

  const isStudying = deck.isStudying;

  const handleEdit = async () => {
    if (!newDeckName.trim()) {
      toast.error("Deck name cannot be empty");
      return;
    }

    if (
      newDeckName === deck.name &&
      newDeckDescription === (deck.description || "")
    ) {
      setIsEditDialogOpen(false);
      return;
    }

    setIsEditing(true);
    try {
      await onRename(deck, newDeckName, newDeckDescription);
      setIsEditDialogOpen(false);
      toast.success("Deck updated successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update deck";
      toast.error(message);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg">
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
            <p className="text-sm text-muted-foreground">{deck.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                isStudying ? onStopStudying(deck) : onStudy(deck)
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
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewDeckName(deck.name);
                  setNewDeckDescription(deck.description || "");
                  setIsEditDialogOpen(true);
                }}
                disabled={deck.isDefault}
                title={
                  deck.isDefault ? "Cannot edit default deck" : "Edit deck"
                }
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(deck)}
                disabled={deck.isDefault}
                title={
                  deck.isDefault ? "Cannot delete default deck" : "Delete deck"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
            <DialogDescription>
              Update the name and description for &quot;{deck.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label
                htmlFor="deck-name"
                className="text-sm font-medium mb-2 block"
              >
                Deck Name
              </label>
              <Input
                id="deck-name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="Deck name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    void handleEdit();
                  }
                }}
              />
            </div>
            <div>
              <label
                htmlFor="deck-description"
                className="text-sm font-medium mb-2 block"
              >
                Description (optional)
              </label>
              <Input
                id="deck-description"
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
                placeholder="A brief description of this deck"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
