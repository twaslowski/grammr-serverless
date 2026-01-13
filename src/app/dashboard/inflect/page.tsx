import { InflectionForm } from "@/components/inflection";
import { getProfile } from "@/lib/profile";

export default async function InflectionsPage() {
  const profile = await getProfile();

  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-2xl">
        <h1 className="font-bold text-3xl mb-2">Inflect</h1>
        <p className="text-muted-foreground">
          Enter a word to see all its inflected forms. Select the part of speech
          to get accurate inflections.
        </p>
      </div>
      <InflectionForm learnedLanguage={profile.target_language} />
    </div>
  );
}
