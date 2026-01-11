// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      phrase,
      word,
      source_language,
      target_language,
    }: LiteralTranslationRequest = await req.json();

    if (!phrase || !word || !source_language || !target_language) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: phrase, word, source_language, target_language",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Literal translation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Literal translation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
