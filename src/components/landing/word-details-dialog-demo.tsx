import React, { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { InflectionsTable } from "@/components/inflection/inflections-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getPosLabel } from "@/lib/feature-labels";
import {
  FALLBACK_FEATURE_TYPE,
  getFeatureDisplayType,
  getFeatureDisplayValue,
} from "@/types/feature";
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
  translation: initialTranslation,
  morphology,
  trigger,
  paradigm,
}: WordDetailsDialogDemoProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const defaultTrigger = <p className="cursor-pointer">{word}</p>;

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Basic word info */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Word
              </p>
              <p className="font-medium text-lg">{word}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Translation
              </p>
              <p className="font-medium">{initialTranslation || "?"}</p>
            </div>
            {morphology && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Lemma
                  </p>
                  <p className="font-medium">{morphology.lemma}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Part of Speech
                  </p>
                  <p className="font-medium">{getPosLabel(morphology.pos)}</p>
                </div>
              </div>
            )}
            {/* Grammatical Features */}
            {morphology &&
              morphology.features.filter(
                (f) => f.type !== FALLBACK_FEATURE_TYPE,
              ).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Grammatical Features
                  </p>
                  <div className="space-y-1">
                    {morphology.features
                      .filter((f) => f.type !== FALLBACK_FEATURE_TYPE)
                      .map((feature, index) => (
                        <div
                          key={index}
                          className="text-sm flex items-center gap-2"
                        >
                          <span className="font-medium text-muted-foreground">
                            {getFeatureDisplayType(feature)}:
                          </span>
                          <span>{getFeatureDisplayValue(feature)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>

          {/* Inflections section */}
          {paradigm && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="inflections">
                <AccordionTrigger>Inflections</AccordionTrigger>
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
