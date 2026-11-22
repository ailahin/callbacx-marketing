"use client";

/**
 * CALLBACX TECHNOLOGY — useConnectionStatus Hook
 *
 * Tracks online/offline status for PWA and mobile clients.
 * Reusable across web and React Native.
 */

import * as React from "react";

export type ConnectionStatus = "online" | "offline" | "unknown";

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = React.useState<ConnectionStatus>(
    typeof navigator !== "undefined" ? (navigator.onLine ? "online" : "offline") : "unknown"
  );

  React.useEffect(() => {
    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("offline");

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return status;
}
