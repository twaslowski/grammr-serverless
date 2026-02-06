import React from "react";

import { PageLayout } from "@/components/page-header";

export default function FlashcardImportExportPage() {
  return (
    <PageLayout
      header={{
        title: "Account Settings",
        description:
          "Manage your account settings, including email, password, and connected accounts.",
        backHref: "/dashboard/settings",
        backLabel: "Back to settings",
      }}
    >
      <div>todo: implement</div>
    </PageLayout>
  );
}
