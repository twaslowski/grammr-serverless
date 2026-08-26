import { ApiError, createValidatedFetcher } from "@/lib/api/validated-fetcher";
import {
  InflectablePosSet,
  InflectionsRequest,
  Paradigm,
  ParadigmSchema,
  PartOfSpeech,
} from "@/types/inflections";
import { LanguageCode } from "@/types/languages";
import {
  EnrichedMorphologicalAnalysis,
  MorphologicalAnalysis,
} from "@/types/morphology";

/**
 * Which table shape a paradigm needs.
 *
 * The three groupings this replaces disagreed: adjectives are noun-like in that
 * they decline for case and number, but their gender is a dimension of the
 * paradigm rather than a property of the lexeme, so they need a third layout of
 * their own. Deriving all of it from one function keeps that distinction in a
 * single place.
 *
 * The set matches `InflectablePosSet`, since a paradigm can only ever come from
 * a request this app made for one of those parts of speech.
 */
export type ParadigmLayout = "noun" | "adjective" | "verb" | "unsupported";

export function paradigmLayout(pos: PartOfSpeech): ParadigmLayout {
  switch (pos) {
    case "ADJ":
      return "adjective";
    case "NOUN":
      return "noun";
    case "VERB":
    case "AUX":
      return "verb";
    default:
      return "unsupported";
  }
}

export class InflectionError extends Error {
  constructor(
    message: string,
    public isUserError: boolean = false,
  ) {
    super(message);
    this.name = "InflectionError";
  }
}

const fetchParadigm = createValidatedFetcher(ParadigmSchema);

/**
 * A failed paradigm lookup, classified for the UI.
 *
 * The route answers 400 for the cases the reader can act on — unknown word,
 * part-of-speech mismatch, low confidence — and anything else is ours to fix.
 */
function asInflectionError(error: unknown): InflectionError {
  if (error instanceof ApiError) {
    return error.status === 400
      ? new InflectionError(
          error.detail ??
            "Could not inflect the provided word. Please check the word and part of speech.",
          true,
        )
      : new InflectionError(error.detail ?? "An unexpected error occurred");
  }

  // Anything else means the response did not match ParadigmSchema.
  return new InflectionError("Invalid response from server");
}

export async function getParadigm(
  request: InflectionsRequest,
): Promise<Paradigm> {
  try {
    return await fetchParadigm("/api/v1/inflections", {
      method: "POST",
      body: JSON.stringify(request),
    });
  } catch (error) {
    throw asInflectionError(error);
  }
}

export const enrichWithParadigms = async (
  morphologicalAnalysis: MorphologicalAnalysis,
  language: LanguageCode,
): Promise<EnrichedMorphologicalAnalysis> => {
  // Create a map to store paradigms by lemma+pos key
  const paradigmMap = new Map<string, Paradigm>();

  // Get all inflectable tokens
  const inflectableTokens = morphologicalAnalysis.tokens.filter((token) =>
    InflectablePosSet.has(token.pos),
  );

  // Create promises for all inflection requests
  const paradigmPromises = inflectableTokens.map(async (token) => {
    const key = `${token.lemma}:${token.pos}`;
    try {
      const paradigm = await getParadigm({
        lemma: token.lemma,
        pos: token.pos,
        language: language,
      });
      paradigmMap.set(key, paradigm);
    } catch (e) {
      console.warn(
        `Failed to fetch paradigm for "${token.lemma}" (${token.pos}):`,
        e instanceof Error ? e.message : e,
      );
    }
  });

  // Wait for all paradigm requests to complete
  await Promise.all(paradigmPromises);

  // Enrich all tokens with paradigm data where available
  const enrichedTokens = morphologicalAnalysis.tokens.map((token) => {
    const key = `${token.lemma}:${token.pos}`;
    const paradigm = paradigmMap.get(key);

    return {
      ...token,
      ...(paradigm && { paradigm }),
    };
  });

  return {
    ...morphologicalAnalysis,
    tokens: enrichedTokens,
  };
};
