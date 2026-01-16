import { TokenMorphology } from "@/types/morphology";
import { FALLBACK_FEATURE_TYPE } from "@/types/feature";

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
          {morphology.features.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Features
              </p>
              <div className="flex flex-wrap gap-1">
                {morphology.features
                  .filter((f) => f.type !== FALLBACK_FEATURE_TYPE)
                  .map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                    >
                      {feature.type}: {feature.value}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
