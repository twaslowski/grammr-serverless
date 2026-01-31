import {
  TranslationRequest,
  TranslationResponse,
  TranslationResponseSchema,
} from "@/types/translation";

export async function translate(
  request: TranslationRequest,
): Promise<TranslationResponse> {
  const response = await fetch("/api/v2/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to translate word");
  }

  const payload = await response.json();
  const parsed = TranslationResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw Error("Invalid response format from translation API");
  }

  return parsed.data;
}
