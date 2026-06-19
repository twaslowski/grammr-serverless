"use client";

import { useEffect, useState } from "react";
import { DownloadIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as Window & { MSStream?: unknown }).MSStream,
    );

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (isStandalone) {
    return null; // Don't show install button if already installed
  }

  if (!isIOS) {
    return null; // Show install button only for iOS devices
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
