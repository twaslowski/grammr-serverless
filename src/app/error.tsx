"use client";

import { useEffect } from "react";

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
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="text-gray-600">An unexpected error occurred.</p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
