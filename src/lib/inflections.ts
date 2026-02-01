import {
  InflectablePosSet,
  InflectionsRequest,
  Paradigm,
  ParadigmSchema,
} from "@/types/inflections";
import { MorphologicalAnalysis } from "@/types/morphology";
import { LanguageCode } from "@/types/languages";

export class InflectionError extends Error {
  constructor(
    message: string,
    public isUserError: boolean = false,
  ) {
    super(message);
    this.name = "InflectionError";
  }
}

export async function getInflections(
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

export const fetchParadigms = async (
  morphologicalAnalysis: MorphologicalAnalysis,
  language: LanguageCode,
): Promise<Paradigm[]> => {
  const inflectableTokens = morphologicalAnalysis.tokens.filter((token) =>
    InflectablePosSet.has(token.pos),
  );

  // Create promises for all inflection requests
  const paradigmPromises = inflectableTokens.map(async (token) => {
    try {
      return await getInflections({
        lemma: token.lemma,
        pos: token.pos,
        language: language,
      });
    } catch (e) {
      console.warn(
        `Failed to fetch paradigm for "${token.lemma}" (${token.pos}):`,
        e instanceof Error ? e.message : e,
      );
      return null; // Return null for failed requests
    }
  });

  // Wait for all promises to settle and filter out null results
  const results = await Promise.all(paradigmPromises);
  return results.filter((paradigm): paradigm is Paradigm => paradigm !== null);
};
