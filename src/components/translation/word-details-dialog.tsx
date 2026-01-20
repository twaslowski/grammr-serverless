"use client";

import { useState } from "react";
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
import { FALLBACK_FEATURE_TYPE } from "@/types/feature";

interface WordDetailsDialogProps {
  word: string;
  translation: string | null;
  morphology: TokenMorphology | null;
  isLoading?: boolean;
}

// Map common POS tags to inflection POS enum
function mapPosToInflectionPos(pos: string): PartOfSpeech | null {
  const upperPos = pos.toUpperCase();
  if (upperPos === "NOUN") return "NOUN";
  if (upperPos === "ADJ") return "ADJ";
  if (upperPos === "VERB") return "VERB";
  if (upperPos === "AUX") return "AUX";
  return null;
}

export function WordDetailsDialog({
  word,
  translation,
  morphology,
  isLoading = false,
}: WordDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [paradigm, setParadigm] = useState<Paradigm | null>(null);
  const [isLoadingInflections, setIsLoadingInflections] = useState(false);
  const [inflectionError, setInflectionError] = useState<string | null>(null);

  const profile = useProfile();
  const sourceLanguage = profile.source_language;

  const isDataAvailable = translation && morphology;
  const isDisabled = isLoading || !isDataAvailable;

  const handleOpenChange = async (newOpen: boolean) => {
    // Don't allow opening if data isn't ready
    if (newOpen && !isDataAvailable) {
      return;
    }

    setOpen(newOpen);

    // Fetch inflections when dialog opens
    if (newOpen && morphology && !paradigm && !isLoadingInflections) {
      const inflectionPos = mapPosToInflectionPos(morphology.pos);

      if (!inflectionPos) {
        setInflectionError(
          `Inflections not available for part of speech: ${morphology.pos}`,
        );
        return;
      }

      setIsLoadingInflections(true);
      setInflectionError(null);

      try {
        const result = await getInflections({
          lemma: morphology.lemma,
          pos: inflectionPos,
          language: sourceLanguage,
        });
        setParadigm(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load inflections";
        setInflectionError(message);
      } finally {
        setIsLoadingInflections(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 h-8 text-xs"
          disabled={isDisabled}
          aria-label={
            isLoading
              ? "Loading word details"
              : !isDataAvailable
                ? "Translation data not available"
                : `View detailed information for ${word}`
          }
          title={
            isLoading
              ? "Loading..."
              : !isDataAvailable
                ? "Translation data not available"
                : "View detailed word information"
          }
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Info className="h-3 w-3" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Word Details: {word}</DialogTitle>
            <CreateFlashcardDialog
              front={word}
              type="word"
              translation={translation || ""}
              paradigm={paradigm || undefined}
              compact={true}
            />
          </div>
          <DialogDescription>
            View translation, morphology, and inflections for this word
          </DialogDescription>
        </DialogHeader>
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
              <p className="font-medium text-lg text-primary">{translation}</p>
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
                  <p className="font-medium">{morphology.pos}</p>
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
                          {feature.type}:
                        </span>
                        <span>{feature.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Inflections section */}
          <div>
            <h3 className="font-semibold mb-3">Inflections</h3>
            {isLoadingInflections ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Loading inflections...
                </span>
              </div>
            ) : inflectionError ? (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                {inflectionError}
              </div>
            ) : paradigm ? (
              <InflectionsTable
                paradigm={paradigm}
                displayAddFlashcard={false}
              />
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
