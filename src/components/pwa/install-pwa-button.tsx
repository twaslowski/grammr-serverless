"use client";

import { DownloadIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useIsIOS, useIsStandalone } from "@/lib/client-only";

export function InstallPrompt() {
  const isIOS = useIsIOS();
  const isStandalone = useIsStandalone();

  // Already installed, nothing to prompt for.
  if (isStandalone) {
    return null;
  }

  // Other platforms get the native `beforeinstallprompt` flow; iOS has no
  // equivalent and needs the manual walkthrough at /help/pwa.
  if (!isIOS) {
    return null;
  }

  return (
    <Link href="/help/pwa">
      <Button variant="outline" size="sm">
        <DownloadIcon />
        Install App
      </Button>
    </Link>
  );
}
