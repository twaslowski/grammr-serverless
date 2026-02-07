import { SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * Configuration options for the API handler wrapper
 */
export type ApiHandlerConfig<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
> = {
  /** Require authentication (default: true) */
  requireAuth?: boolean;

  /** Zod schema for request body validation (for POST/PATCH/PUT) */
  bodySchema?: ZodSchema<TBody>;

  /** Zod schema for route params (e.g., { id: z.coerce.number() }) */
  paramsSchema?: ZodSchema<TParams>;

  /** Zod schema for query params */
  querySchema?: ZodSchema<TQuery>;
};

/**
 * Context passed to the handler function
 */
export type ApiHandlerContext<TBody, TParams, TQuery> = {
  /** Authenticated user (undefined if requireAuth is false and not authenticated) */
  user: User;
  /** Supabase client */
  supabase: SupabaseClient;
  /** Validated request body (undefined if no bodySchema provided) */
  body: TBody;
  /** Validated route params (undefined if no paramsSchema provided) */
  params: TParams;
  /** Validated query params (undefined if no querySchema provided) */
  query: TQuery;
  /** Original NextRequest */
  request: NextRequest;
};

/**
 * Handler function type
 */
type ApiHandler<TBody, TParams, TQuery> = (
  ctx: ApiHandlerContext<TBody, TParams, TQuery>,
) => Promise<NextResponse>;

/**
 * Next.js route params type
 */
type NextRouteParams = {
  params: Promise<Record<string, string>>;
};

/**
 * Higher-order function that wraps API route handlers with common functionality:
 * - Authentication validation
 * - Request body validation (via Zod schema)
 * - Route params validation (via Zod schema)
 * - Query params validation (via Zod schema)
 * - Error handling with consistent responses
 *
 * @example
 * // Simple authenticated route
 * export const GET = withApiHandler({}, async ({ user, supabase }) => {
 *   const { data } = await supabase.from("items").select();
 *   return NextResponse.json(data);
 * });
 *
 * @example
 * // Route with body and params validation
 * export const PATCH = withApiHandler(
 *   {
 *     paramsSchema: z.object({ id: z.coerce.number().int().positive() }),
 *     bodySchema: UpdateItemSchema,
 *   },
 *   async ({ user, supabase, params, body }) => {
 *     // params.id is a validated number
 *     // body is validated against UpdateItemSchema
 *     const { data } = await supabase
 *       .from("items")
 *       .update(body)
 *       .eq("id", params.id);
 *     return NextResponse.json(data);
 *   }
 * );
 */
export function withApiHandler<
  TBody = undefined,
  TParams = undefined,
  TQuery = undefined,
>(
  config: ApiHandlerConfig<TBody, TParams, TQuery>,
  handler: ApiHandler<TBody, TParams, TQuery>,
): (
  request: NextRequest,
  routeParams?: NextRouteParams,
) => Promise<NextResponse> {
  const { requireAuth = true, bodySchema, paramsSchema, querySchema } = config;

  return async (
    request: NextRequest,
    routeParams?: NextRouteParams,
  ): Promise<NextResponse> => {
    try {
      const supabase = await createClient();

      // Authentication
      let user: User | undefined;
      if (requireAuth) {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        user = authUser;
      }

      // Parse and validate route params
      let params: TParams = undefined as TParams;
      if (paramsSchema && routeParams) {
        const rawParams = await routeParams.params;
        const paramsResult = paramsSchema.safeParse(rawParams);

        if (!paramsResult.success) {
          return NextResponse.json(
            {
              error: "Invalid route parameters",
              details: z.flattenError(paramsResult.error),
            },
            { status: 400 },
          );
        }
        params = paramsResult.data;
      }

      // Parse and validate query params
      let query: TQuery = undefined as TQuery;
      if (querySchema) {
        const searchParams = request.nextUrl.searchParams;
        const rawQuery: Record<string, string | null> = {};
        searchParams.forEach((value, key) => {
          rawQuery[key] = value;
        });

        const queryResult = querySchema.safeParse(rawQuery);

        if (!queryResult.success) {
          return NextResponse.json(
            {
              error: "Invalid query parameters",
              details: z.flattenError(queryResult.error),
            },
            { status: 400 },
          );
        }
        query = queryResult.data;
      }

      // Parse and validate request body
      let body: TBody = undefined as TBody;
      if (bodySchema) {
        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return NextResponse.json(
            { error: "Invalid JSON in request body" },
            { status: 400 },
          );
        }

        const bodyResult = bodySchema.safeParse(rawBody);

        if (!bodyResult.success) {
          return NextResponse.json(
            {
              error: "Invalid request body",
              details: z.flattenError(bodyResult.error),
            },
            { status: 400 },
          );
        }
        body = bodyResult.data;
      }

      // Call the actual handler
      return await handler({
        user: user as User,
        supabase,
        body,
        params,
        query,
        request,
      });
    } catch (error) {
      console.error("API handler error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

/**
 * Common param schemas for reuse
 */
export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
