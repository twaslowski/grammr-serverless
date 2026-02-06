import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { queryWithValidation, queryWithValidationResult } from "../database";

// Mock Supabase client type
type MockSupabaseClient = Partial<SupabaseClient>;

describe("queryWithValidation", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = {} as MockSupabaseClient;
  });

  describe("successful queries", () => {
    it("should return validated data when query succeeds and data is valid", async () => {
      const mockData = [
        { id: "1", name: "John Doe", email: "john@example.com" },
        { id: "2", name: "Jane Smith", email: "jane@example.com" },
      ];

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
        }),
      );

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toEqual(mockData);
      expect(mockQuery).toHaveBeenCalledWith(mockSupabase);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("should return validated single object when query returns single record", async () => {
      const mockData = { id: "1", name: "John Doe", email: "john@example.com" };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      });

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toEqual(mockData);
    });

    it("should handle complex nested schemas", async () => {
      const mockData = {
        id: "1",
        user: {
          name: "John",
          profile: {
            age: 30,
            verified: true,
          },
        },
        tags: ["tag1", "tag2"],
      };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        user: z.object({
          name: z.string(),
          profile: z.object({
            age: z.number(),
            verified: z.boolean(),
          }),
        }),
        tags: z.array(z.string()),
      });

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toEqual(mockData);
    });

    it("should handle empty arrays", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const schema = z.array(z.object({ id: z.string() }));

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toEqual([]);
    });

    it("should transform data with Zod transformations", async () => {
      const mockData = { count: "42" };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        count: z.string().transform((val) => parseInt(val, 10)),
      });

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toEqual({ count: 42 });
    });
  });

  describe("Supabase query errors", () => {
    it("should throw error when Supabase query fails", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      const schema = z.object({ id: z.string() });

      await expect(
        queryWithValidation(mockSupabase as SupabaseClient, mockQuery, schema),
      ).rejects.toThrow("Supabase query failed: Database connection failed");
    });

    it("should throw error with detailed Supabase error message", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Row level security policy jestolation",
          code: "42501",
        },
      });

      const schema = z.object({ id: z.string() });

      await expect(
        queryWithValidation(mockSupabase as SupabaseClient, mockQuery, schema),
      ).rejects.toThrow(
        "Supabase query failed: Row level security policy jestolation",
      );
    });
  });

  describe("validation errors", () => {
    it("should throw error with flattened errors when validation fails", async () => {
      const mockData = [
        { id: 123, name: "John", email: "invalid-email" }, // id should be string, email is invalid
      ];

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
        }),
      );

      await expect(
        queryWithValidation(mockSupabase as SupabaseClient, mockQuery, schema),
      ).rejects.toThrow("Validation failed");
    });

    it("should include field-specific errors in the error message", async () => {
      const mockData = { id: 123, email: "not-an-email" };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        email: z.string().email(),
      });

      try {
        await queryWithValidation(
          mockSupabase as SupabaseClient,
          mockQuery,
          schema,
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain("Validation failed");
          // The error message should contain the flattened errors in JSON format
          expect(error.message).toContain("fieldErrors");
        }
      }
    });

    it("should handle missing required fields", async () => {
      const mockData = { id: "1" }; // missing 'name' and 'email'

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      });

      await expect(
        queryWithValidation(mockSupabase as SupabaseClient, mockQuery, schema),
      ).rejects.toThrow("Validation failed");
    });

    it("should handle type mismatches", async () => {
      const mockData = {
        id: "1",
        age: "thirty", // should be number
        active: "yes", // should be boolean
      };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        age: z.number(),
        active: z.boolean(),
      });

      await expect(
        queryWithValidation(mockSupabase as SupabaseClient, mockQuery, schema),
      ).rejects.toThrow("Validation failed");
    });

    it("should handle validation errors in nested objects", async () => {
      const mockData = {
        id: "1",
        user: {
          name: "John",
          age: "invalid", // should be number
        },
      };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
      });

      await expect(
        queryWithValidation(mockSupabase as SupabaseClient, mockQuery, schema),
      ).rejects.toThrow("Validation failed");
    });

    it("should handle validation errors in arrays", async () => {
      const mockData = [
        { id: "1", count: 10 },
        { id: "2", count: "invalid" }, // invalid count
      ];

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.array(
        z.object({
          id: z.string(),
          count: z.number(),
        }),
      );

      await expect(
        queryWithValidation(mockSupabase as SupabaseClient, mockQuery, schema),
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("edge cases", () => {
    it("should handle null data from Supabase", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const schema = z.null();

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toBeNull();
    });

    it("should handle undefined data from Supabase", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: undefined,
        error: null,
      });

      const schema = z.undefined();

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toBeUndefined();
    });

    it("should use optional fields correctly", async () => {
      const mockData = { id: "1", name: "John" }; // age is optional

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        name: z.string(),
        age: z.number().optional(),
      });

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toEqual(mockData);
    });

    it("should handle default values in schema", async () => {
      const mockData = { id: "1" };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        status: z.string().default("active"),
      });

      const result = await queryWithValidation(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result).toEqual({ id: "1", status: "active" });
    });
  });
});

describe("queryWithValidationResult", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = {} as MockSupabaseClient;
  });

  describe("successful queries", () => {
    it("should return success result with validated data", async () => {
      const mockData = { id: "1", name: "John" };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const result = await queryWithValidationResult(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
      }
    });

    it("should return success for complex valid data", async () => {
      const mockData = [
        { id: "1", count: 10 },
        { id: "2", count: 20 },
      ];

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.array(
        z.object({
          id: z.string(),
          count: z.number(),
        }),
      );

      const result = await queryWithValidationResult(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
      }
    });
  });

  describe("Supabase query errors", () => {
    it("should return failure result with error message on Supabase error", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Connection timeout" },
      });

      const schema = z.object({ id: z.string() });

      const result = await queryWithValidationResult(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.formErrors).toContain(
          "Supabase query failed: Connection timeout",
        );
      }
    });
  });

  describe("validation errors", () => {
    it("should return failure result with flattened errors on validation failure", async () => {
      const mockData = { id: 123, email: "invalid" };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        email: z.string().email(),
      });

      const result = await queryWithValidationResult(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });

    it("should not throw error on validation failure", async () => {
      const mockData = { id: 123 };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({ id: z.string() });

      // Should not throw
      await expect(
        queryWithValidationResult(
          mockSupabase as SupabaseClient,
          mockQuery,
          schema,
        ),
      ).resolves.toBeDefined();
    });

    it("should include field errors for multiple invalid fields", async () => {
      const mockData = {
        id: 123, // should be string
        email: "not-an-email", // invalid email
        age: "thirty", // should be number
      };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        email: z.string().email(),
        age: z.number(),
      });

      const result = await queryWithValidationResult(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });
  });

  describe("result type discrimination", () => {
    it("should allow type-safe access to data on success", async () => {
      const mockData = { id: "1", name: "Test" };

      const mockQuery = jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const schema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const result = await queryWithValidationResult(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      // TypeScript should narrow the type based on success property
      if (result.success) {
        expect(result.data.id).toBe("1");
        expect(result.data.name).toBe("Test");
      } else {
        expect.fail("Should have succeeded");
      }
    });

    it("should allow type-safe access to errors on failure", async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Failed" },
      });

      const schema = z.object({ id: z.string() });

      const result = await queryWithValidationResult(
        mockSupabase as SupabaseClient,
        mockQuery,
        schema,
      );

      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors.formErrors).toBeDefined();
      } else {
        expect.fail("Should have failed");
      }
    });
  });
});
