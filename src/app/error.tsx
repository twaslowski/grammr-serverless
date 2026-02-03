"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Unknown error</h1>
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <div className="px-4" />
      <div className="flex gap-4">
        <Button onClick={reset} size="lg">
          Try again
        </Button>
        <Button
          asChild
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          size="lg"
        >
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
