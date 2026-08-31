import { cn } from "@/lib/utils";
import { CollectionStats } from "@/types/stats";

/**
 * The four FSRS states as one stacked bar.
 *
 * This is the app's only correct use of the `chart-1..5` tokens: they are a
 * *categorical* palette — four unrelated hues in both themes — and these are
 * four unrelated categories. Do not reach for them as an intensity ramp.
 *
 * The four slots were validated for colour-vision separation (worst adjacent
 * pair ΔE 9.1 protan in light, 10.7 in dark — both above the 8 floor). Two
 * checks do not pass and cannot be fixed from here: in light mode `chart-3` is
 * nearly achromatic and `chart-4` sits at 1.6:1 against the card. That is a
 * property of the theme's tokens, not of this assignment. The mitigation is the
 * legend below, which labels every state with its count — so no segment is ever
 * identified by colour alone, and a segment too faint to see still has a
 * readable number.
 */
const SEGMENTS = [
  { key: "review", label: "Review", fill: "bg-chart-1" },
  { key: "learning", label: "Learning", fill: "bg-chart-2" },
  { key: "new", label: "New", fill: "bg-chart-3" },
  { key: "relearning", label: "Relearning", fill: "bg-chart-4" },
] as const;

/** Below this a percentage-width segment rounds away to nothing. */
const MIN_SEGMENT_PX = 3;

/**
 * Segments are separated by a gap in the surface colour rather than butted
 * together, so two adjacent fills read as two quantities instead of one band
 * with a hue change. `gap` on the flex row would be subtracted from the
 * percentage widths; a ring drawn in the track colour is not.
 */
const SEGMENT_GAP = "ring-2 ring-card";

interface StateBarProps {
  collection: CollectionStats;
}

export function StateBar({ collection }: StateBarProps) {
  const { total } = collection;
  const present = SEGMENTS.filter((segment) => collection[segment.key] > 0);

  return (
    <div>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={present
          .map((segment) => `${collection[segment.key]} ${segment.label}`)
          .join(", ")}
      >
        {present.map((segment) => (
          <div
            key={segment.key}
            className={cn(segment.fill, SEGMENT_GAP)}
            style={{
              // One relearning card in a deck of four hundred is 0.25% and
              // would render as zero pixels. It is still a fact about the deck.
              width: `${(collection[segment.key] / total) * 100}%`,
              minWidth: MIN_SEGMENT_PX,
            }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {SEGMENTS.map((segment) => (
          <li
            key={segment.key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${segment.fill}`}
              aria-hidden="true"
            />
            {segment.label}
            <span className="font-medium tabular-nums text-foreground">
              {collection[segment.key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
