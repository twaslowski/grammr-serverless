import {
  CreateFlashcardRequest,
  FlashcardImportRequest,
  FlashcardImportResponse,
  FlashcardImportResponseSchema,
  FlashcardListQuery,
  UpdateFlashcardRequest,
} from "@/app/api/v1/flashcards/schema";
import {
  apiFetchBlob,
  apiFetchVoid,
  createValidatedFetcher,
} from "@/lib/api/validated-fetcher";
import {
  Flashcard,
  FlashcardBack,
  FlashcardPage,
  FlashcardPageSchema,
  FlashcardSchema,
} from "@/types/flashcards";
import { Paradigm } from "@/types/inflections";

const BASE_URL = "/api/v1/flashcards";

const fetchFlashcardPage = createValidatedFetcher(FlashcardPageSchema);
const fetchFlashcard = createValidatedFetcher(FlashcardSchema);
const postImport = createValidatedFetcher(FlashcardImportResponseSchema);

// --- Flashcard operations ---
export async function getFlashcards(
  query?: Partial<FlashcardListQuery>,
): Promise<FlashcardPage> {
  const params = new URLSearchParams();
  if (query?.deckId) params.set("deckId", query.deckId.toString());
  if (query?.search) params.set("search", query.search);
  if (query?.limit !== undefined) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;

  return fetchFlashcardPage(url, { method: "GET" });
}

export async function createFlashcard(
  request: CreateFlashcardRequest,
): Promise<Flashcard> {
  return fetchFlashcard(BASE_URL, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateFlashcard(
  id: number,
  request: UpdateFlashcardRequest,
): Promise<Flashcard> {
  return fetchFlashcard(`${BASE_URL}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
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
): Promise<FlashcardImportResponse> {
  return postImport(`${BASE_URL}/import`, {
    method: "POST",
    body: JSON.stringify(data),
  });
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
