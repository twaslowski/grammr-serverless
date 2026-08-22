import { z } from "zod";

/**
 * Client-side helpers for calling this app's own API routes.
 *
 * All of them share the same failure contract: a non-2xx response carries a
 * JSON body of `{ error: string }` (see `withApiHandler`), which is surfaced
 * as the thrown Error's message.
 */

async function request(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string,
): Promise<Response> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || fallbackMessage);
  }

  return response;
}

/**
 * Builds a fetcher that validates the JSON response against `schema`.
 *
 * Prefer this over `apiFetch` wherever a response schema exists: it turns a
 * server-side shape change into a clear error at the boundary instead of an
 * undefined access deep in a component.
 */
export function createValidatedFetcher<T>(schema: z.ZodType<T>) {
  return async (url: string, options?: RequestInit): Promise<T> => {
    const response = await request(url, options, `Failed to fetch from ${url}`);

    const result = schema.safeParse(await response.json());

    if (!result.success) {
      throw new Error("Validation error: " + result.error.message);
    }

    return result.data;
  };
}

/** Calls an API route and returns the parsed JSON body, unvalidated. */
export async function apiFetch<T>(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string,
): Promise<T> {
  const response = await request(url, options, fallbackMessage);

  return response.json() as Promise<T>;
}

/** Calls an API route that returns no meaningful body. */
export async function apiFetchVoid(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string,
): Promise<void> {
  await request(url, options, fallbackMessage);
}

/** Calls an API route that returns a binary payload. */
export async function apiFetchBlob(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string,
): Promise<Blob> {
  const response = await request(url, options, fallbackMessage);

  return response.blob();
}
