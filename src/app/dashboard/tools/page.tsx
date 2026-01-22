"use client";

import { CyrillicTransliterator } from "@/components/tools/cyrillic-transliterator";
import { PageLayout } from "@/components/page-header";

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
