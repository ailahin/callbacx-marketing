"use client";

/**
 * CALLBACX MARKETING — Admin StatCard
 *
 * Reusable key-metric card for admin dashboard overview.
 * Touch-friendly, responsive, works on mobile and desktop.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  change?: { value: number; label: string; positive?: boolean };
  icon?: React.ReactNode;
  color?: "brand" | "accent" | "sage" | "neutral" | "error";
  format?: "number" | "currency" | "percent" | "raw";
  currency?: string;
}

const colorClasses: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/30 dark:text-brand-400 dark:border-brand-900",
  accent: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-950/30 dark:text-accent-400 dark:border-accent-900",
  sage: "bg-sage-50 text-sage-700 border-sage-200 dark:bg-sage-950/30 dark:text-sage-400 dark:border-sage-900",
  neutral: "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-950/30 dark:text-neutral-400 dark:border-neutral-900",
  error: "bg-error-50 text-error-700 border-error-200 dark:bg-error-950/30 dark:text-error-400 dark:border-error-900",
};

export function StatCard({
  title,
  value,
  subtitle,
  change,
  icon,
  color = "brand",
  format = "number",
  currency = "USD",
}: StatCardProps) {
  const displayValue =
    format === "currency"
      ? formatCurrency(typeof value === "number" ? value : 0, currency)
      : format === "percent"
        ? `${typeof value === "number" ? value : 0}%`
          : format === "raw"
            ? String(value)
            : formatNumber(typeof value === "number" ? value : 0);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-5 bg-surface shadow-sm transition-all duration-200 hover:shadow-md",
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-tertiary">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-text-primary">{displayValue}</span>
            {subtitle && <span className="text-sm text-text-secondary">{subtitle}</span>}
          </div>
          {change && (
            <p className={cn("mt-2 text-xs font-medium", change.positive ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400")}>
              {change.positive ? "+" : ""}{change.value} {change.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4 p-2 rounded-lg bg-surface/50 text-text-tertiary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
