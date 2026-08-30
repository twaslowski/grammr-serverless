import { NextResponse } from "next/server";

import { apiGatewayNotConfiguredResponse } from "@/lib/api/api-gateway";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { resolve } from "@/lib/dictionary-lookup";
import { DictionaryRequestSchema } from "@/types/dictionary";

/**
 * Dictionary lookup.
 *
 * Deliberately unlike `POST /api/v1/inflections`, which turns anything it cannot
 * handle into a 400 that the UI renders as an error card. Here a word that is not
 * in the dictionary is a 200 with no entries, because "no such word" is an answer
 * a dictionary is supposed to be able to give. The only 4xx left is a malformed
 * request.
 *
 * `requireAuth: false` matches the inflections route: this is reference material,
 * and gating it would break the unauthenticated landing-page demo.
 */
export const POST = withApiHandler(
  {
    bodySchema: DictionaryRequestSchema,
    requireAuth: false,
  },
  async ({ body }) => {
    const { query, language, pos } = body;

    try {
      const { entries, resolvedFrom } = await resolve(query, language, pos);

      return NextResponse.json({
        query,
        ...(resolvedFrom ? { resolvedFrom } : {}),
        entries,
      });
    } catch (error) {
      // Re-thrown unless it is specifically a missing-gateway-config error.
      return apiGatewayNotConfiguredResponse(error);
    }
  },
);
