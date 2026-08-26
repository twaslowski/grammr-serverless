import React, { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { InflectionsTable } from "@/components/inflection/inflections-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getFeatureDisplayLabel,
  getOrderedFeatures,
  getPosLabel,
} from "@/lib/feature-labels";
import { Paradigm } from "@/types/inflections";
import { TokenMorphology } from "@/types/morphology";

interface WordDetailsDialogDemoProps {
  word: string;
  translation?: string;
  morphology: TokenMorphology;
  paradigm?: Paradigm;
  trigger?: React.ReactNode;
}

export function WordDetailsDialogDemo({
  word,
  translation,
  morphology,
  trigger,
  paradigm,
}: WordDetailsDialogDemoProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const defaultTrigger = <p className="cursor-pointer">{word}</p>;

  const features = morphology ? getOrderedFeatures(morphology.features) : [];
  const lemma = morphology?.lemma;
  const showLemma = !!lemma && lemma.toLowerCase() !== word.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <VisuallyHidden>
        <DialogHeader>
          <DialogTitle>Word Details: {word}</DialogTitle>
          <DialogDescription>
            View translation, morphology, and inflections for this word
          </DialogDescription>
        </DialogHeader>
      </VisuallyHidden>
      <DialogContent className="max-h-[85vh] max-w-2xl gap-0 overflow-y-auto p-0">
        {/* Header: the word itself and its grammatical identity */}
        <div className="border-b bg-muted/30 px-6 py-5">
          <div className="min-w-0 space-y-2 pr-8">
            <h2 className="truncate text-3xl font-semibold leading-tight tracking-tight">
              {word}
            </h2>
            {morphology && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <Badge variant="secondary" className="rounded-full font-medium">
                  {getPosLabel(morphology.pos)}
                </Badge>
                {features.map((feature, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span aria-hidden="true">·</span>}
                    <span>{getFeatureDisplayLabel(feature)}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Translation
            </p>
            <div className="flex min-h-12 w-full items-center rounded-lg border bg-muted/40 px-4 py-2">
              <span className="text-lg leading-snug">{translation || "?"}</span>
            </div>
          </div>

          {showLemma && (
            <div className="flex items-baseline justify-between gap-4 border-t pt-4 text-sm">
              <span className="text-muted-foreground">Dictionary form</span>
              <span className="font-medium">{lemma}</span>
            </div>
          )}

          {/* Inflections section */}
          {paradigm && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem
                value="inflections"
                className="border-b-0 border-t"
              >
                <AccordionTrigger className="hover:no-underline">
                  Inflections
                </AccordionTrigger>
                <AccordionContent>
                  <InflectionsTable
                    paradigm={paradigm}
                    displayAddFlashcard={false}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
