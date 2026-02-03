import React, { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { CreateFlashcardDialog } from "@/components/flashcard";
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
import { TranslationInput } from "@/components/ui/translation-input";
import { getPosLabel } from "@/lib/feature-labels";
import { createFlashcardBack } from "@/lib/flashcards";
import {
  FALLBACK_FEATURE_TYPE,
  getFeatureDisplayType,
  getFeatureDisplayValue,
} from "@/types/feature";
import { Paradigm } from "@/types/inflections";
import { TokenMorphology } from "@/types/morphology";

interface WordDetailsDialogProps {
  word: string;
  translation?: string;
  morphology: TokenMorphology;
  paradigm?: Paradigm;
  trigger?: React.ReactNode;
}

export function WordDetailsDialog({
  word,
  translation: initialTranslation,
  morphology,
  trigger,
  paradigm,
}: WordDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [translation, setTranslation] = useState(initialTranslation || "");

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset translation to initial value when dialog opens
      setTranslation(initialTranslation || "");
    }
  };

  const defaultTrigger = <p className="cursor-pointer">{word}</p>;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <VisuallyHidden>
        <DialogHeader>
          {/* The right-padding avoids collision with the X card close button */}
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Word Details: {word}</DialogTitle>
            <CreateFlashcardDialog
              front={morphology?.lemma || word}
              back={createFlashcardBack(translation, paradigm)}
            />
          </div>
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
              <TranslationInput
                value={translation}
                textToTranslate={word}
                onChange={setTranslation}
                editable={false}
                className="max-w-64"
                placeholder="?"
              />
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
