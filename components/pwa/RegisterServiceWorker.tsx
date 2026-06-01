"use client";

import { useEffect } from "react";

// Registers the service worker after load. Production-only: a service worker in
// dev fights with hot-reload. Renders nothing.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure must never break the app — silently ignore.
    });
  }, []);

  return null;
}
