"use client";

import { PageLayout } from "@/components/page-header";
import { CyrillicTransliterator } from "@/components/tools/cyrillic-transliterator";

export default function ToolsPage() {
  return (
    <PageLayout
      header={{
        title: "Tools",
        description: "A collection of useful language learning utilities",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <CyrillicTransliterator />
    </PageLayout>
  );
}
