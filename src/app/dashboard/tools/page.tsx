"use client";

import { CyrillicTransliterator } from "@/components/tools/cyrillic-transliterator";

export default function ToolsPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-2xl">
        <h1 className="font-bold text-3xl mb-2">Tools</h1>
        <p className="text-muted-foreground">
          A collection of useful language learning utilities
        </p>
      </div>
      <CyrillicTransliterator />
    </div>
  );
}
