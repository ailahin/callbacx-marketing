import * as React from "react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * Section - consistent page section wrapper
 * Provides constrained container, vertical padding, and optional background.
 */
export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  bg?: "none" | "subtle" | "brand" | "surface";
  id?: string;
}

const paddingStyles = {
  none: "py-0",
  sm: "py-12 lg:py-16",
  md: "py-20 lg:py-28",
  lg: "py-24 lg:py-32",
  xl: "py-32 lg:py-40",
};

const bgStyles = {
  none: "bg-transparent",
  subtle: "bg-surface-subtle/50 dark:bg-surface-subtle/30",
  brand: "bg-brand-50 dark:bg-brand-950/10",
  surface: "bg-surface",
};

export function Section({
  children,
  className,
  containerClassName,
  padding = "md",
  bg = "none",
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(bgStyles[bg], paddingStyles[padding], className)}
      aria-labelledby={id}
    >
      <div
        className={cn(
          "mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

Section.displayName = "Section";

/**
 * SectionGrid - responsive grid for feature/service cards
 */
export interface SectionGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: { base?: number; sm?: number; md?: number; lg?: number };
  gap?: "sm" | "md" | "lg" | "xl";
}

const gapStyles = {
  sm: "gap-6",
  md: "gap-8",
  lg: "gap-10",
  xl: "gap-12",
};

export function SectionGrid({
  children,
  className,
  cols = { base: 1, sm: 2, lg: 3 },
  gap = "md",
}: SectionGridProps) {
  const gridCols = `grid-cols-${cols.base} sm:grid-cols-${cols.sm ?? cols.base} lg:grid-cols-${cols.lg ?? cols.sm ?? cols.base}`;
  return (
    <div
      className={cn("grid", gridCols, gapStyles[gap], className)}
    >
      {children}
    </div>
  );
}

SectionGrid.displayName = "SectionGrid";
