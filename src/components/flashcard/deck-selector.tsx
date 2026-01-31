import React from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "lucide-react";
import { Deck } from "@/types/flashcards";

interface DeckSelectorProps {
  decks: Deck[];
  value?: string;
  onChange: (deck: Deck) => void;
}

export function DeckSelector({ decks, value, onChange }: DeckSelectorProps) {
  if (decks.length <= 1) return null;

  const findDeckByName = (name: string): void => {
    const deck = decks.find((deck) => deck.name === name);
    if (deck) {
      onChange(deck);
    }
  };

  return (
    <Select.Root
      value={value || "Select deck"}
      onValueChange={(val) => findDeckByName(val)}
    >
      <Select.Trigger
        className="inline-flex items-center justify-between rounded-md border border-primary/50 px-3 py-1"
        aria-label="deck-select"
      >
        <Select.Value placeholder="Select deck" />
        <Select.Icon>
          <ChevronDownIcon className="h-4 w-4 opacity-70" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md z-100">
          <Select.Viewport className="p-1">
            {decks.map((deck) => (
              <Select.Item
                key={deck.id}
                value={deck.name}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden"
              >
                <Select.ItemText>
                  <span>{deck.name}</span>
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
