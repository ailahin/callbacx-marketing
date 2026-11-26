"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ProcessStep - single numbered process step
 */
export interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ProcessStep({
  number,
  title,
  description,
  icon,
  className,
}: ProcessStepProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white font-semibold shadow-lg shadow-brand">
        {number}
      </div>
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/10 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-text-primary">{title}</h4>
      <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
        {description}
      </p>
    </div>
  );
}

ProcessStep.displayName = "ProcessStep";

/**
 * ProcessSteps - responsive grid of numbered process steps
 */
export interface ProcessStepsProps {
  steps: ProcessStepProps[];
  className?: string;
  cols?: { base?: number; sm?: number; lg?: number };
}

export function ProcessSteps({
  steps,
  className,
  cols = { base: 1, sm: 2, lg: 3 },
}: ProcessStepsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16 items-start",
        className
      )}
    >
      {steps.map((step, index) => (
        <ProcessStep key={step.number} {...step} />
      ))}
    </div>
  );
}

ProcessSteps.displayName = "ProcessSteps";
