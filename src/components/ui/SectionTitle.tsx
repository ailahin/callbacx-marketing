"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionTitle - consistent section heading pattern used across the site
 */
export interface SectionTitleProps {
  title: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  className?: string;
  textAlign?: "left" | "center";
}

export function SectionTitle({
  title,
  description,
  titleClassName,
  descriptionClassName,
  className,
  textAlign = "center",
}: SectionTitleProps) {
  return (
    <div className={cn("space-y-3", textAlign === "center" ? "text-center" : "text-left", className)}>
      <h2 id={title.toLowerCase().replace(/\s+/g, "-")} className={cn("text-h2 font-semibold text-text-primary tracking-tight", titleClassName)}>
        {title}
      </h2>
      {description && (
        <p className={cn("text-lg text-text-secondary leading-relaxed max-w-2xl", textAlign === "center" ? "mx-auto" : "", descriptionClassName)}>
          {description}
        </p>
      )}
    </div>
  );
}

SectionTitle.displayName = "SectionTitle";
