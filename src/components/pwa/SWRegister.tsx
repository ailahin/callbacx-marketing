"use client";

/**
 * CALLBACX MARKETING — SWRegister
 *
 * Registers the service worker for offline fallback and caching.
 * Also handles PWA install prompt (beforeinstallprompt event)
 * and exposes an install button for browsers that don't auto-prompt.
 */

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export interface SWRegisterProps {}

let deferredPrompt: any = null;

export function SWRegister({}: SWRegisterProps) {
  const [canInstall, setCanInstall] = React.useState(false);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    // Register service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      deferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] Install outcome:", outcome);
    deferredPrompt = null;
    setCanInstall(false);
    setInstalled(true);
  };

  // Only show install button on standalone-capable browsers and not already installed.
  // Guard browser-only globals: this client component is still server-rendered,
  // where `window`/`navigator` are undefined.
  if (typeof window === "undefined") return null;

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (installed || isStandalone) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 sm:bottom-8 sm:left-auto sm:right-8 sm:w-auto z-50">
      {canInstall && !isIOS ? (
        <Button
          onClick={handleInstall}
          variant="primary"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          className="shadow-lg"
        >
          Install App
        </Button>
      ) : isIOS ? (
        <div className="bg-background border border-border-subtle rounded-lg p-3 text-xs text-text-secondary shadow-lg">
          To install on iOS: tap <span className="font-medium">Share</span> → <span className="font-medium">Add to Home Screen</span>
        </div>
      ) : null}
    </div>
  );
}
