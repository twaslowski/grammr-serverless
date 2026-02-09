import { z } from "zod";

import {
  CreateFlashcardRequest,
  FlashcardListQuery,
  UpdateFlashcardRequest,
} from "@/app/api/v1/flashcards/schema";
import { createValidatedFetcher } from "@/lib/api/validated-fetcher";
import { Deck, DeckSchema, DeckVisibility } from "@/types/deck";
import {
  Flashcard,
  FlashcardBack,
  FlashcardWithDeck,
  FlashcardWithDeckSchema,
} from "@/types/flashcards";
import { Paradigm } from "@/types/inflections";

const BASE_URL = "/api/v1/flashcards";

export async function getDecks(): Promise<Deck[]> {
  const fetchDecks = createValidatedFetcher(z.array(DeckSchema));

  return fetchDecks(`${BASE_URL}/decks`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteDeck(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/decks/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete deck");
  }
}

// --- Flashcard operations ---
export async function getFlashcards(
  query?: FlashcardListQuery,
): Promise<FlashcardWithDeck[]> {
  const params = new URLSearchParams();
  if (query?.deckId) params.set("deckId", query.deckId.toString());
  if (query?.search) params.set("search", query.search);

  const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;

  const fetchFlashcards = createValidatedFetcher(
    z.array(FlashcardWithDeckSchema),
  );
  return fetchFlashcards(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

export async function createFlashcard(
  request: CreateFlashcardRequest,
): Promise<Flashcard> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create flashcard");
  }

  return response.json();
}

export async function updateFlashcard(
  id: number,
  request: UpdateFlashcardRequest,
): Promise<Flashcard> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update flashcard");
  }

  return response.json();
}

export async function deleteFlashcard(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete flashcard");
  }
}

export async function stopStudyingFlashcard(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}/study`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to study flashcard");
  }
}

// --- Export/Import operations ---

export async function exportFlashcards(): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/export`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to export flashcards");
  }

  return response.blob();
}

export async function importFlashcards(data: {
  version: number;
  language: string;
  deck_name?: string;
  visibility?: DeckVisibility;
  flashcards: Array<{
    front: string;
    type: string;
    back: { translation: string; paradigm?: unknown };
    notes?: string | null;
  }>;
}): Promise<{ message: string; imported_count: number }> {
  const response = await fetch(`${BASE_URL}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to import flashcards");
  }

  return response.json();
}

// --- Additional operations can be added here as needed ---
export const getParadigm = (flashcard: Flashcard): Paradigm | undefined => {
  if (flashcard.back.type === "word") {
    return flashcard.back.paradigm;
  }
  return undefined;
};

export const createFlashcardBack = (
  translation: string,
  paradigm?: Paradigm,
): FlashcardBack => {
  return paradigm
    ? { type: "word", translation, paradigm }
    : { type: "phrase", translation };
};
