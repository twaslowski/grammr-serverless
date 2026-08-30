import { createValidatedFetcher } from "@/lib/api/validated-fetcher";
import {
  DictionaryRequest,
  DictionaryResponse,
  DictionaryResponseSchema,
} from "@/types/dictionary";

const fetchDictionary = createValidatedFetcher(DictionaryResponseSchema);

/**
 * Look a word up.
 *
 * Note what is missing compared with `getParadigm` in `@/lib/inflections`: there
 * is no `InflectionError`, and no `isUserError` for the caller to branch on. A
 * word that is not in the dictionary comes back as an empty `entries` array, so
 * the only thing left to throw about is a genuine failure — which is the
 * difference between a dictionary and a generator.
 */
export async function lookup(
  request: DictionaryRequest,
): Promise<DictionaryResponse> {
  return fetchDictionary("/api/v1/dictionary", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
