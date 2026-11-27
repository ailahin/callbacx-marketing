"use client";

/**
 * CALLBACX TECHNOLOGY — Admin StatusBadge
 *
 * Reusable status badge with consistent colors across admin domains.
 * Touch-friendly with adequate tap targets on mobile.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  suspended: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
  banned: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
  deleted: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  pending: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
  verified: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  rejected: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
  expired: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  published: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  draft: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  paused: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
  archived: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  cancelled: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
  succeeded: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  failed: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
  refunded: "bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400",
  partially_refunded: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
  open: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
  in_review: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
  resolved: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  closed: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  negotiating: "bg-info-100 text-info-700 dark:bg-info-900/20 dark:text-info-400",
  completed: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  under_review: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
  low: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  medium: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
  high: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
  urgent: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
  reviewed: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
  dismissed: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  actioned: "bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400",
};

const sizeStyles: Record<string, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || statusStyles.neutral;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap",
        sizeStyles[size],
        style,
        className
      )}
    >
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}
