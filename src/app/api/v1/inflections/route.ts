import { NextResponse } from "next/server";

import {
  apiGatewayNotConfiguredResponse,
  callApiGateway,
} from "@/lib/api/api-gateway";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { InflectionsRequestSchema, ParadigmSchema } from "@/types/inflections";

export const POST = withApiHandler(
  {
    bodySchema: InflectionsRequestSchema,
    requireAuth: false,
  },
  async ({ body }) => {
    const { lemma, pos, language } = body;

    let response: Response;
    try {
      response = await callApiGateway(`/inflections/${language}`, {
        lemma,
        pos,
      });
    } catch (error) {
      return apiGatewayNotConfiguredResponse(error);
    }

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse response:", responseText);
      return NextResponse.json(
        { error: "Invalid response from inflections service" },
        { status: 500 },
      );
    }

    if (!response.ok) {
      console.error("Inflections API error:", response.status, responseData);

      // Handle 400 errors (user errors like low confidence or POS mismatch)
      if (response.status === 400) {
        return NextResponse.json(
          {
            error:
              responseData.error ||
              "Could not inflect the provided word. Please check the word and part of speech.",
          },
          { status: 400 },
        );
      }

      // Handle other errors
      return NextResponse.json(
        { error: responseData.error || "Inflections lookup failed" },
        { status: response.status },
      );
    }

    // Validate the service's response here rather than only in the browser, so
    // a contract break is one clear 502 instead of a parse failure per caller.
    const paradigm = ParadigmSchema.safeParse(responseData);

    if (!paradigm.success) {
      console.error(
        "Invalid response from inflections service:",
        paradigm.error,
      );
      return NextResponse.json(
        { error: "Invalid response from inflections service" },
        { status: 502 },
      );
    }

    return NextResponse.json(paradigm.data);
  },
);
