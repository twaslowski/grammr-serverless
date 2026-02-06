import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flashcardId = parseInt(id, 10);
    if (isNaN(flashcardId)) {
      return NextResponse.json(
        { error: "Invalid flashcard ID" },
        { status: 400 },
      );
    }

    const { data: card, error } = await supabase
      .from("card")
      .select("*")
      .eq("flashcard_id", flashcardId)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Flashcard get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flashcardId = parseInt(id, 10);
    if (isNaN(flashcardId)) {
      return NextResponse.json(
        { error: "Invalid flashcard ID" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("card")
      .delete()
      .eq("flashcard_id", flashcardId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Could not delete flashcard", reason: error.details },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Flashcard deleted successfully" });
  } catch (error) {
    console.error("Flashcard get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
