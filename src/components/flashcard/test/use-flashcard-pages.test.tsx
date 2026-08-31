import "@testing-library/jest-dom";

import { act, renderHook, waitFor } from "@testing-library/react";

import { useFlashcardPages } from "@/components/flashcard/use-flashcard-pages";
import { getFlashcards } from "@/lib/flashcards";
import { FlashcardPage, FlashcardWithDeck } from "@/types/flashcards";

jest.mock("@/lib/flashcards", () => ({ getFlashcards: jest.fn() }));

const mockGetFlashcards = getFlashcards as jest.MockedFunction<
  typeof getFlashcards
>;

const card = (id: number): FlashcardWithDeck => ({
  id,
  deckId: 1,
  front: `card-${id}`,
  back: { type: "phrase", translation: `translation-${id}` },
  notes: null,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const page = (ids: number[], nextOffset: number | null): FlashcardPage => ({
  items: ids.map(card),
  nextOffset,
});

beforeEach(() => {
  mockGetFlashcards.mockReset();
});

describe("useFlashcardPages", () => {
  it("loads the first page on mount", async () => {
    mockGetFlashcards.mockResolvedValue(page([1, 2], 25));

    const { result } = renderHook(() => useFlashcardPages());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items.map((c) => c.id)).toEqual([1, 2]);
    expect(result.current.hasMore).toBe(true);
  });

  it("appends the next page rather than replacing", async () => {
    mockGetFlashcards.mockResolvedValueOnce(page([1, 2], 25));
    const { result } = renderHook(() => useFlashcardPages());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGetFlashcards.mockResolvedValueOnce(page([3, 4], null));
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.items).toHaveLength(4));
    expect(result.current.items.map((c) => c.id)).toEqual([1, 2, 3, 4]);
    expect(result.current.hasMore).toBe(false);
  });

  /**
   * A row edited between two page fetches shifts position and can arrive
   * twice. Rendering it twice would look like data corruption.
   */
  it("dedupes a row that arrives on two pages", async () => {
    mockGetFlashcards.mockResolvedValueOnce(page([1, 2], 25));
    const { result } = renderHook(() => useFlashcardPages());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGetFlashcards.mockResolvedValueOnce(page([2, 3], null));
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.items.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it("stops paging when the server reports the end", async () => {
    mockGetFlashcards.mockResolvedValue(page([1], null));
    const { result } = renderHook(() => useFlashcardPages());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasMore).toBe(false);
    act(() => result.current.loadMore());
    expect(mockGetFlashcards).toHaveBeenCalledTimes(1);
  });

  it("restarts from the top when the search changes", async () => {
    mockGetFlashcards.mockResolvedValue(page([1, 2], 25));
    const { result } = renderHook(() => useFlashcardPages());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGetFlashcards.mockResolvedValue(page([9], null));
    act(() => result.current.setSearch("стол"));

    await waitFor(() =>
      expect(result.current.items.map((c) => c.id)).toEqual([9]),
    );
    expect(mockGetFlashcards).toHaveBeenLastCalledWith({
      search: "стол",
      offset: 0,
    });
  });

  it("surfaces a failure without clearing the list", async () => {
    mockGetFlashcards.mockResolvedValueOnce(page([1], 25));
    const { result } = renderHook(() => useFlashcardPages());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockGetFlashcards.mockRejectedValueOnce(new Error("network down"));
    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.error).toBe("network down"));
    expect(result.current.items).toHaveLength(1);
  });

  it("drops a deleted card locally", async () => {
    mockGetFlashcards.mockResolvedValue(page([1, 2], null));
    const { result } = renderHook(() => useFlashcardPages());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.remove(1));

    expect(result.current.items.map((c) => c.id)).toEqual([2]);
  });

  it("swaps an edited card in place", async () => {
    mockGetFlashcards.mockResolvedValue(page([1, 2], null));
    const { result } = renderHook(() => useFlashcardPages());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.replace({ ...card(1), front: "edited" }));

    expect(result.current.items[0].front).toBe("edited");
    expect(result.current.items.map((c) => c.id)).toEqual([1, 2]);
  });
});
