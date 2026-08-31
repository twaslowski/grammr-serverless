"use client";

import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { CardDetail } from "@/components/flashcard/card-detail";
import { cn } from "@/lib/utils";

interface CardDisclosureProps {
  detail: CardDetail | null;
}

/**
 * Expands a card's extra detail in place.
 *
 * Inline rather than the modal it replaces: on a phone a dialog covers the
 * thing you were looking at to show you more of it, and the inflection table
 * is the one piece of content people want to compare against the card.
 *
 * Renders nothing when there is no detail, so a phrase card keeps the same row
 * shape without offering a control that leads nowhere.
 */
export function CardDisclosure({ detail }: CardDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  if (!detail) {
    return null;
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex min-h-11 w-full items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
        {detail.label} ({detail.count})
      </button>

      {/*
        Mounted only when open: the inflection table is not cheap, and a list
        page can hold twenty-five of these.
      */}
      {isOpen && (
        <div id={contentId} className="overflow-x-auto pt-2">
          {detail.render()}
        </div>
      )}
    </div>
  );
}
