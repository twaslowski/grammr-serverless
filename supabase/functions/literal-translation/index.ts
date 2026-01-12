// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { validateAuth } from "../_shared/auth.ts";
import { createRequestLogger } from "../_shared/logging.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface LiteralTranslationRequest {
  phrase: string;
  word: string;
  source_language: string;
  target_language: string;
}

interface LiteralTranslationResponse {
  phrase: string;
  word: string;
  source_language: string;
  target_language: string;
  translation: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Initialize logger (will be updated with userId after auth)
  let logger = createRequestLogger("literal-translation");

  try {
    // Validate authentication
    const authResult = await validateAuth(req);
    if (!authResult.success) {
      logger.error(401, authResult.error || "Unauthorized");
      return errorResponse(authResult.error || "Unauthorized", 401);
    }

    // Update logger with authenticated user ID
    logger = createRequestLogger("literal-translation", authResult.userId);

    if (!OPENAI_API_KEY) {
      logger.error(500, "OPENAI_API_KEY missing");
      return errorResponse("Server configuration error", 500);
    }

    const {
      phrase,
      word,
      source_language,
      target_language,
    }: LiteralTranslationRequest = await req.json();

    if (!phrase || !word || !source_language || !target_language) {
      logger.error(400, "Missing required fields", {
        phrase,
        word,
        source_language,
        target_language,
      });
      return errorResponse(
        "Missing required fields: phrase, word, source_language, target_language",
        400,
      );
    }

    const systemPrompt = `You are a language expert providing literal word translations.
Given a phrase in ${source_language} and a specific word from that phrase, provide the literal translation of that word into ${target_language}.
Consider the context of the phrase to provide the most accurate translation for how the word is used.
Respond ONLY with a JSON object in this exact format: {"translation": "literal translation of the word"}
Do not include any other text, explanations, or formatting.`;

    const userPrompt = `Phrase: "${phrase}"
Word to translate: "${word}"`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(500, `OpenAI API error: ${response.status}`, {
        openai_status: response.status,
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      logger.error(500, "No response content from OpenAI");
      throw new Error("No response content from OpenAI");
    }

    const parsed = JSON.parse(content);

    const result: LiteralTranslationResponse = {
      phrase,
      word,
      source_language,
      target_language,
      translation: parsed.translation,
    };

    logger.success(200, { source_language, target_language, word });
    return jsonResponse(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Literal translation failed";
    logger.error(500, errorMessage);
    return errorResponse(errorMessage, 500);
  }
});
