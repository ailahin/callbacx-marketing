"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: { value: string; positive: boolean };
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color?: "brand" | "accent" | "sage" | "neutral";
  subtitle?: string;
}

const colorConfigs: Record<string, { bg: string; text: string; shadow: string }> = {
  brand: {
    bg: "bg-brand-50 dark:bg-brand-950/10",
    text: "text-brand-600 dark:text-brand-400",
    shadow: "shadow-brand/10",
  },
  accent: {
    bg: "bg-accent-50 dark:bg-accent-950/10",
    text: "text-accent-600 dark:text-accent-400",
    shadow: "shadow-accent/10",
  },
  sage: {
    bg: "bg-sage-50 dark:bg-sage-950/10",
    text: "text-sage-600 dark:text-sage-400",
    shadow: "shadow-sage/10",
  },
  neutral: {
    bg: "bg-neutral-100 dark:bg-neutral-800/30",
    text: "text-neutral-600 dark:text-neutral-400",
    shadow: "shadow-sm",
  },
};

export function StatsCard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  color = "brand",
  subtitle,
}: StatsCardProps) {
  const config = colorConfigs[color] ?? colorConfigs.brand;
  const changeColor = trend === "up" ? "text-success-600 dark:text-success-400" : trend === "down" ? "text-error-600 dark:text-error-400" : "text-text-tertiary";

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 p-5 shadow-sm dark:border-neutral-800 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex-shrink-0 p-2.5 rounded-xl ${config.bg} ${config.text}`}>
          {React.createElement(Icon)}
        </div>
        {change && (
          <span className={cn("text-xs font-semibold", changeColor)}>
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"} {change.value}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
        {title}
      </p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {subtitle && <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>}
    </div>
  );
}
