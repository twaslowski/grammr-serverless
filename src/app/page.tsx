import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <div className="pb-24">
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 text-center lg:px-8">
        <div className="mx-auto flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Master Languages with
          </h1>
          <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Systematic Grammar Learning
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Your companion for language learning. Get instant grammatical
            analysis, translations, and flashcard generation to boost your
            vocabulary and comprehension.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="px-6">
              <Link href="/auth/sign-up">
                Sign Up
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-6">
              <Link href="/dashboard">Already have an account?</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
