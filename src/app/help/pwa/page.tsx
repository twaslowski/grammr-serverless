"use client";

import React, { useEffect, useState } from "react";
import { PageLayout } from "@/components/page-header";
import { Share, SquarePlus, CheckCircle2, ImageIcon } from "lucide-react";

const STEPS = [
  {
    icon: Share,
    title: "Tap the Share icon",
    description: "In Safari\u2019s toolbar, tap the share icon.",
  },
  {
    icon: SquarePlus,
    title: 'Tap "Add to Home Screen"',
    description: "Scroll down the share menu until you see this option.",
  },
  {
    icon: CheckCircle2,
    title: 'Confirm by tapping "Add"',
    description: "Grammr will now appear as an app on your home screen.",
  },
];

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
    );
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (isStandalone) {
    return null; // Don't show install button if already installed
  }

  return (
    <PageLayout
      header={{
        title: "Install as PWA",
        description:
          "Install grammr as a Progressive Web App (PWA) to access it directly from your home screen and enjoy a more app-like experience.",
        backHref: "/",
        backLabel: "Back home",
      }}
    >
      {isIOS && (
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          {/* Steps */}
          <ol className="space-y-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium leading-none">{step.title}</p>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Screenshot placeholder */}
          <div className="flex aspect-[9/16] max-h-[480px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground md:mx-auto md:max-w-xs">
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm">Add a screenshot here</p>
            <p className="px-6 text-center text-xs">
              e.g. the iOS share sheet with "Add to Home Screen" highlighted
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default function Page() {
  return (
    <div>
      <InstallPrompt />
    </div>
  );
}
