import { TokenMorphology } from "@/types/morphology";

interface MorphologyProps {
  word: string;
  translation: string;
  morphology: TokenMorphology;
}

export function Morphology({ word, translation, morphology }: MorphologyProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Word
        </p>
        <p className="font-medium">{word}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Translation
        </p>
        <p className="font-medium text-primary">{translation}</p>
      </div>
      {morphology && (
        <>
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
        </>
      )}
    </div>
  );
}
