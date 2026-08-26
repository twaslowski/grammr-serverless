import React, { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { CreateFlashcardDialog } from "@/components/flashcard";
import { InflectionsTable } from "@/components/inflection/inflections-table";
import { TTSButton } from "@/components/tts/tts-button";
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
import { TranslationInput } from "@/components/ui/translation-input";
import {
  getFeatureDisplayLabel,
  getOrderedFeatures,
  getPosLabel,
} from "@/lib/feature-labels";
import { createFlashcardBack } from "@/lib/flashcards";
import { Paradigm } from "@/types/inflections";
import { LanguageCode } from "@/types/languages";
import { TokenMorphology } from "@/types/morphology";

interface WordDetailsDialogProps {
  word: string;
  language: LanguageCode;
  translation?: string;
  morphology: TokenMorphology;
  paradigm?: Paradigm;
  trigger?: React.ReactNode;
}

export function WordDetailsDialog({
  word,
  translation: initialTranslation,
  language,
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

  const features = morphology ? getOrderedFeatures(morphology.features) : [];
  const lemma = morphology?.lemma;

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
        {/* Header: the word itself, its grammatical identity and its actions */}
        <div className="border-b bg-muted/30 px-6 py-5">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0 space-y-2">
              <h2 className="truncate text-3xl font-semibold leading-tight tracking-tight">
                {word}
              </h2>
              {(morphology || features.length > 0) && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  {morphology && (
                    <Badge
                      variant="secondary"
                      className="rounded-full font-medium"
                    >
                      {getPosLabel(morphology.pos)}
                    </Badge>
                  )}
                  {features.map((feature, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span aria-hidden="true">·</span>}
                      <span>{getFeatureDisplayLabel(feature)}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <TTSButton text={word} language={language} />
              <CreateFlashcardDialog
                front={paradigm ? paradigm.lemma : word}
                back={createFlashcardBack(translation, paradigm)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Translation, hidden until the reader asks for it */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Translation
            </p>
            <TranslationInput
              value={translation}
              textToTranslate={word}
              onChange={setTranslation}
              editable={false}
            />
          </div>

          <div className="flex items-baseline justify-between gap-4 border-t pt-4 text-sm">
            <span className="text-muted-foreground">Dictionary form</span>
            <span className="font-medium">{lemma}</span>
          </div>

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
                    displayTTSButton={false}
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
