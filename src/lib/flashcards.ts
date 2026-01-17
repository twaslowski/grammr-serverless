import { Deck, Flashcard, FlashcardWithDeck } from "@/types/flashcards";
import {
  CreateDeckRequest,
  CreateFlashcardRequest,
  FlashcardListQuery,
  UpdateDeckRequest,
  UpdateFlashcardRequest,
} from "@/app/api/v1/flashcards/schema";

const BASE_URL = "/api/v1/flashcards";

export async function getDecks(): Promise<Deck[]> {
  const response = await fetch(`${BASE_URL}/decks`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch decks");
  }

  return response.json();
}

export async function getDeck(id: number): Promise<Deck> {
  const response = await fetch(`${BASE_URL}/decks/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch deck");
  }

  return response.json();
}

export async function getDefaultDeck(): Promise<Deck> {
  const response = await fetch(`${BASE_URL}/decks/default`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch default deck");
  }

  return response.json();
}

export async function createDeck(request: CreateDeckRequest): Promise<Deck> {
  const response = await fetch(`${BASE_URL}/decks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create deck");
  }

  return response.json();
}

export async function updateDeck(
  id: number,
  request: UpdateDeckRequest,
): Promise<Deck> {
  const response = await fetch(`${BASE_URL}/decks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update deck");
  }

  return response.json();
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
  if (query?.deck_id) params.set("deck_id", query.deck_id.toString());
  if (query?.search) params.set("search", query.search);
  if (query?.sort_by) params.set("sort_by", query.sort_by);
  if (query?.sort_order) params.set("sort_order", query.sort_order);

  const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch flashcards");
  }

  return response.json();
}

export async function getFlashcard(id: number): Promise<Flashcard> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch flashcard");
  }

  return response.json();
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
