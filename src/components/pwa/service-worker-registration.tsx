"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in `public/sw.js`.
 *
 * The worker currently only handles push events; registering it is the
 * prerequisite for subscribing a user to push notifications.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  }, []);

  return null;
}
