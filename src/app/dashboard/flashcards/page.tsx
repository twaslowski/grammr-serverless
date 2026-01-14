import { FlashcardList } from "@/components/flashcard";

export default async function FlashcardsPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-2xl">
        <h1 className="font-bold text-3xl mb-2">Flashcards</h1>
        <p className="text-muted-foreground">
          Review and manage your flashcards. Add new cards from translations or
          inflection tables.
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <FlashcardList />
      </div>
    </div>
  );
}
