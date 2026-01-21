import { StudySession } from "@/components/study";

export const metadata = {
  title: "Study | Grammr",
  description: "Review your flashcards with spaced repetition",
};

export default function StudyPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">Study Session</h1>
        <p className="text-muted-foreground">
          Review your flashcards using spaced repetition
        </p>
      </div>

      <StudySession />
    </div>
  );
}
