import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Info } from "lucide-react";
import { TokenMorphology } from "@/types/morphology";
import { Paradigm, PartOfSpeech } from "@/types/inflections";
import { getInflections } from "@/lib/inflections";
import { InflectionsTable } from "@/components/inflection/inflections-table";
import { CreateFlashcardDialog } from "@/components/flashcard";
import { useProfile } from "@/components/dashboard/profile-provider";
import {
  FALLBACK_FEATURE_TYPE,
  getFeatureDisplayType,
  getFeatureDisplayValue,
} from "@/types/feature";
import { getPosLabel } from "@/lib/feature-labels";

interface WordDetailsDialogProps {
  word: string;
  translation: string;
  morphology: TokenMorphology;
  paradigm?: Paradigm;
  trigger?: React.ReactNode;
}

export function WordDetailsDialogFull({
  word,
  translation,
  morphology,
  trigger,
  paradigm,
}: WordDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="gap-1 h-8 text-xs"
      title="View detailed information"
    >
      <Info className="h-3 w-3" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
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
            {translation && (
              <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Translation
              </p>
              <p className="font-medium text-lg text-primary">{translation}</p>
              </>
            )}
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
            {morphology && morphology.features.length > 0 && (
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
          <div>
            <h3 className="font-semibold mb-3">Inflections</h3>
            <InflectionsTable paradigm={paradigm} displayAddFlashcard={false} />
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
