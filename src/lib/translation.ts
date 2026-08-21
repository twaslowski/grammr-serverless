import { createValidatedFetcher } from "@/lib/api/validated-fetcher";
import {
  TranslationRequest,
  TranslationResponse,
  TranslationResponseSchema,
} from "@/types/translation";

const fetchTranslation = createValidatedFetcher(TranslationResponseSchema);

export async function translate(
  request: TranslationRequest,
): Promise<TranslationResponse> {
  return fetchTranslation("/api/v2/translate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
