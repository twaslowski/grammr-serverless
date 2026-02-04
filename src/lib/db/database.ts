import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Performs a Supabase query and validates the result against a Zod schema.
 * Throws an error with flattened validation errors if validation fails.
 *
 * @param supabase - The Supabase client instance
 * @param query - A function that receives the Supabase client and returns a query builder
 * @param schema - The Zod schema to validate against
 * @returns The validated data
 * @throws Error if the query fails or validation fails
 *
 * @example
 * ```typescript
 * const UserSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * const users = await queryWithValidation(
 *   supabase,
 *   (client) => client.from('users').select('*'),
 *   z.array(UserSchema)
 * );
 * ```
 */
export async function queryWithValidation<T extends z.ZodTypeAny>(
  supabase: SupabaseClient,
  query: (
    client: SupabaseClient,
  ) => PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  schema: T,
): Promise<z.infer<T>> {
  // Execute the Supabase query
  const { data, error } = await query(supabase);

  // Check for Supabase query errors
  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  // Validate the data against the schema
  const result = schema.safeParse(data);

  if (!result.success) {
    // Flatten the validation errors for better readability
    const flattenedErrors = z.flattenError(result.error);

    console.warn("Got malformed result set:", data);
    throw new Error(
      `Validation failed: ${JSON.stringify(flattenedErrors, null, 2)}`,
    );
  }

  return result.data;
}

/**
 * Alternative version that returns the flattened errors instead of throwing
 *
 * @param supabase - The Supabase client instance
 * @param query - A function that receives the Supabase client and returns a query builder
 * @param schema - The Zod schema to validate against
 * @returns An object with either validated data or flattened errors
 *
 * @example
 * ```typescript
 * const result = await queryWithValidationResult(
 *   supabase,
 *   (client) => client.from('users').select('*'),
 *   z.array(UserSchema)
 * );
 *
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export async function queryWithValidationResult<T extends z.ZodTypeAny>(
  supabase: SupabaseClient,
  query: (
    client: SupabaseClient,
  ) => PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  schema: T,
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; errors: z.ZodFlattenedError<T> }
> {
  // Execute the Supabase query
  const { data, error } = await query(supabase);

  // Check for Supabase query errors
  if (error) {
    return {
      success: false,
      errors: {
        formErrors: [`Supabase query failed: ${error.message}`],
        fieldErrors: {},
      } as z.ZodFlattenedError<T>,
    };
  }

  // Validate the data against the schema
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: z.flattenError(result.error)
        .fieldErrors as z.ZodFlattenedError<T>,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
