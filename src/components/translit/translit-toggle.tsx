"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TranslitToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Turns Latin → Cyrillic conversion on for the field it sits in.
 *
 * Labelled with the glyphs themselves rather than an icon: what the control
 * does is hard to name in a tooltip and obvious from "ЯЖ".
 */
export function TranslitToggle({
  enabled,
  onToggle,
  className,
}: TranslitToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label="Type in Latin, get Cyrillic"
      title="Type in Latin, get Cyrillic"
      className={cn(
        "h-11 w-11 text-sm font-semibold",
        enabled ? "text-primary" : "text-muted-foreground",
        className,
      )}
    >
      ЯЖ
    </Button>
  );
}
