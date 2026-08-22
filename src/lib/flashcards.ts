import { z } from "zod";

import {
  CreateDeckRequest,
  CreateFlashcardRequest,
  FlashcardImportRequest,
  FlashcardListQuery,
  UpdateFlashcardRequest,
} from "@/app/api/v1/flashcards/schema";
import {
  apiFetch,
  apiFetchBlob,
  apiFetchVoid,
  createValidatedFetcher,
} from "@/lib/api/validated-fetcher";
import { Deck, DeckSchema } from "@/types/deck";
import {
  Flashcard,
  FlashcardBack,
  FlashcardWithDeck,
  FlashcardWithDeckSchema,
} from "@/types/flashcards";
import { Paradigm } from "@/types/inflections";

const BASE_URL = "/api/v1/flashcards";

const fetchDecks = createValidatedFetcher(z.array(DeckSchema));
const fetchDeck = createValidatedFetcher(DeckSchema);
const fetchFlashcards = createValidatedFetcher(
  z.array(FlashcardWithDeckSchema),
);

export async function getDecks(): Promise<Deck[]> {
  return fetchDecks(`${BASE_URL}/decks`, { method: "GET" });
}

export async function createDeck({
  name,
  description,
  visibility,
  language,
}: CreateDeckRequest): Promise<Deck> {
  return fetchDeck(`${BASE_URL}/decks`, {
    method: "POST",
    body: JSON.stringify({ name, description, visibility, language }),
  });
}

export async function updateDeck(
  id: number,
  data: { name?: string; description?: string },
): Promise<Deck> {
  return fetchDeck(`${BASE_URL}/decks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDeck(id: number): Promise<void> {
  return apiFetchVoid(
    `${BASE_URL}/decks/${id}`,
    { method: "DELETE" },
    "Failed to delete deck",
  );
}

export async function studyDeck(id: number): Promise<void> {
  return apiFetchVoid(
    `${BASE_URL}/decks/study/${id}`,
    { method: "POST" },
    "Failed to start studying deck",
  );
}

export async function stopStudyingDeck(id: number): Promise<void> {
  return apiFetchVoid(
    `${BASE_URL}/decks/study/${id}`,
    { method: "DELETE" },
    "Failed to stop studying deck",
  );
}

// --- Flashcard operations ---
export async function getFlashcards(
  query?: FlashcardListQuery,
): Promise<FlashcardWithDeck[]> {
  const params = new URLSearchParams();
  if (query?.deckId) params.set("deckId", query.deckId.toString());
  if (query?.search) params.set("search", query.search);

  const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;

  return fetchFlashcards(url, { method: "GET" });
}

export async function createFlashcard(
  request: CreateFlashcardRequest,
): Promise<Flashcard> {
  return apiFetch(
    BASE_URL,
    { method: "POST", body: JSON.stringify(request) },
    "Failed to create flashcard",
  );
}

export async function updateFlashcard(
  id: number,
  request: UpdateFlashcardRequest,
): Promise<Flashcard> {
  return apiFetch(
    `${BASE_URL}/${id}`,
    { method: "PATCH", body: JSON.stringify(request) },
    "Failed to update flashcard",
  );
}

export async function deleteFlashcard(id: number): Promise<void> {
  return apiFetchVoid(
    `${BASE_URL}/${id}`,
    { method: "DELETE" },
    "Failed to delete flashcard",
  );
}

// --- Export/Import operations ---

export async function exportFlashcards(): Promise<Blob> {
  return apiFetchBlob(
    `${BASE_URL}/export`,
    { method: "GET" },
    "Failed to export flashcards",
  );
}

export async function importFlashcards(
  data: FlashcardImportRequest,
): Promise<{ message: string; imported_count: number }> {
  return apiFetch(
    `${BASE_URL}/import`,
    { method: "POST", body: JSON.stringify(data) },
    "Failed to import flashcards",
  );
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
