import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  PhraseTranslationRequestSchema,
  PhraseTranslationResponse,
} from "@/types/translation";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY missing");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = PhraseTranslationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.message },
        { status: 400 },
      );
    }

    const { text, source_language, target_language } = validationResult.data;

    const systemPrompt = `You are a professional translator. Translate the given text from ${source_language} to ${target_language}. 
Respond ONLY with a JSON object in this exact format: {"translation": "your translation here"}
Do not include any other text, explanations, or formatting.`;

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
          { role: "user", content: text },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: "Translation failed" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("No response content from OpenAI");
      return NextResponse.json(
        { error: "Translation failed" },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(content);

    const result: PhraseTranslationResponse = {
      text,
      source_language,
      target_language,
      translation: parsed.translation,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Phrase translation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
