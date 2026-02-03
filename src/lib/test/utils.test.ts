import { z } from "zod";

import { snakeToCamel } from "@/lib/utils";


const DeckStudySchema = z
  .object({
    id: z.uuid(),
    deck_id: z.number(),
    user_id: z.uuid(),
    last_studied_at: z.iso.datetime().nullable(),
    is_active: z.boolean(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
  })
  .transform(snakeToCamel);

describe("snakeToCamel with Zod", () => {
  it("should transform snake_case database data to camelCase", () => {
    const dbData = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      deck_id: 42,
      user_id: "987fcdeb-51a2-43d7-9abc-123456789abc",
      last_studied_at: "2024-01-15T10:30:00Z",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    };

    const result = DeckStudySchema.parse(dbData);

    // Verify camelCase keys exist
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("deckId");
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("lastStudiedAt");
    expect(result).toHaveProperty("isActive");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedAt");

    // Verify values are preserved
    expect(result.id).toBe(dbData.id);
    expect(result.deckId).toBe(dbData.deck_id);
    expect(result.userId).toBe(dbData.user_id);
    expect(result.lastStudiedAt).toBe(dbData.last_studied_at);
    expect(result.isActive).toBe(dbData.is_active);
    expect(result.createdAt).toBe(dbData.created_at);
    expect(result.updatedAt).toBe(dbData.updated_at);

    // Verify snake_case keys are gone
    expect(result).not.toHaveProperty("deck_id");
    expect(result).not.toHaveProperty("user_id");
    expect(result).not.toHaveProperty("last_studied_at");
    expect(result).not.toHaveProperty("is_active");
    expect(result).not.toHaveProperty("created_at");
    expect(result).not.toHaveProperty("updated_at");
  });

  it("should handle nullable fields", () => {
    const dbData = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      deck_id: 42,
      user_id: "987fcdeb-51a2-43d7-9abc-123456789abc",
      last_studied_at: null, // null value
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    };

    const result = DeckStudySchema.parse(dbData);

    expect(result.lastStudiedAt).toBeNull();
  });

  it("should throw validation error for invalid data", () => {
    const invalidData = {
      id: "not-a-uuid",
      deck_id: "not-a-number",
      user_id: "987fcdeb-51a2-43d7-9abc-123456789abc",
      last_studied_at: null,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    };

    expect(() => DeckStudySchema.parse(invalidData)).toThrow();
  });
});
