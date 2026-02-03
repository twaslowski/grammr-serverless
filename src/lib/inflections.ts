import {
  InflectablePosSet,
  InflectionsRequest,
  Paradigm,
  ParadigmSchema,
} from "@/types/inflections";
import { LanguageCode } from "@/types/languages";
import {
  EnrichedMorphologicalAnalysis,
  MorphologicalAnalysis,
} from "@/types/morphology";

export class InflectionError extends Error {
  constructor(
    message: string,
    public isUserError: boolean = false,
  ) {
    super(message);
    this.name = "InflectionError";
  }
}

export async function getParadigm(
  request: InflectionsRequest,
): Promise<Paradigm> {
  const response = await fetch("/api/v1/inflections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    // 400 errors are user errors (invalid word, POS mismatch, low confidence)
    if (response.status === 400) {
      throw new InflectionError(
        data.error ||
          "Could not inflect the provided word. Please check the word and part of speech.",
        true,
      );
    }

    // Other errors are system errors
    throw new InflectionError(
      data.error || "An unexpected error occurred",
      false,
    );
  }

  // Validate response
  const parseResult = ParadigmSchema.safeParse(data);
  if (!parseResult.success) {
    throw new InflectionError("Invalid response from server", false);
  }

  return parseResult.data;
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
