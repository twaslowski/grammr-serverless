import { z } from "zod";

export function createValidatedFetcher<T>(schema: z.ZodType<T>) {
  return async (url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch from ${url}`);
    }

    const data = await response.json();
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new Error("Validation error: " + result.error.message);
    }

    return result.data;
  };
}
