import {
  InflectionsRequest,
  InflectionsResponse,
  InflectionsResponseSchema,
} from "@/types/inflections";

export class InflectionError extends Error {
  constructor(
    message: string,
    public isUserError: boolean = false,
  ) {
    super(message);
    this.name = "InflectionError";
  }
}

export async function getInflections(
  request: InflectionsRequest,
): Promise<InflectionsResponse> {
  const response = await fetch("/api/v1/inflections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    // 400 errors are user errors (invalid word, POS mismatch, low confidence)
    if (response.status === 400) {
      throw new InflectionError(
        data.error ||
          "Could not inflect the provided word. Please check the word and part of speech.",
        true,
      );
    }

    // Other errors are system errors
    throw new InflectionError(
      data.error || "An unexpected error occurred",
      false,
    );
  }

  // Validate response
  const parseResult = InflectionsResponseSchema.safeParse(data);
  if (!parseResult.success) {
    throw new InflectionError("Invalid response from server", false);
  }

  return parseResult.data;
}
