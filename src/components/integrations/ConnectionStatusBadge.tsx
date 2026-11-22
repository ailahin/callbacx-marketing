"use client";

/**
 * CALLBACX TECHNOLOGY — ConnectionStatusBadge
 *
 * Reusable connection status indicator for integration connections.
 * Shows the lifecycle state (connected / pending / expired / revoked /
 * error / disconnected) and whether the provider itself is configured at
 * platform level.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ConnectionStatusBadgeProps {
  status: string;
  providerConfigured?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const statusStyles: Record<string, string> = {
  connected: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  pending: "bg-info-100 text-info-700 dark:bg-info-900/20 dark:text-info-400",
  expired: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
  revoked: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  error: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
  disconnected: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

export function ConnectionStatusBadge({
  status,
  providerConfigured = true,
  size = "sm",
  className,
}: ConnectionStatusBadgeProps) {
  const isConnected = status === "connected";
  const style =
    statusStyles[status.toLowerCase()] ?? statusStyles.disconnected;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        !providerConfigured && "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
        style,
        className
      )}
      title={!providerConfigured ? "Provider not configured by an administrator" : undefined}
    >
      {isConnected && providerConfigured ? (
        <>
          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-success-600 dark:bg-success-400" />
          Connected
        </>
      ) : (
        status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      )}
    </span>
  );
}
