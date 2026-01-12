import {
  PhraseTranslationRequest,
  PhraseTranslationResponse,
  LiteralTranslationRequest,
  LiteralTranslationResponse,
} from "@/types/translation";

export async function translatePhrase(
  request: PhraseTranslationRequest,
): Promise<PhraseTranslationResponse> {
  const response = await fetch("/api/translations/phrase", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to translate phrase");
  }

  return response.json();
}

export async function translateWord(
  request: LiteralTranslationRequest,
): Promise<LiteralTranslationResponse> {
  const response = await fetch("/api/translations/word", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to translate word");
  }

  return response.json();
}
