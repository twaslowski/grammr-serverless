"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Share, SquarePlus } from "lucide-react";

import { PageLayout } from "@/components/page-header";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;

  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setIsIOS(
      /* eslint */
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as Window & { MSStream?: unknown }).MSStream,
    );
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setCanInstall(false);
      deferredPrompt.current = null;
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      deferredPrompt.current = null;
      setCanInstall(false);
    }
  };

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
      {canInstall && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Your browser supports one-click installation.
          </p>
          {installed ? (
            <p className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Grammr has been installed!
            </p>
          ) : (
            <Button onClick={handleInstallClick}>
              <Download className="mr-2 h-4 w-4" />
              Install Grammr
            </Button>
          )}
        </div>
      )}

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
        </div>
      )}

      {!isIOS && !canInstall && (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Your browser does not support PWA installation or you have already
            installed it. Please check your browser settings or try a different
            browser.
          </p>
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
