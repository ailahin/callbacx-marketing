"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * FaqItem - single accordion FAQ item
 */
export interface FaqItemProps {
  question: string;
  answer: string;
  className?: string;
}

export function FaqItem({ question, answer, className }: FaqItemProps) {
  return (
    <div className={cn("border border-border-subtle rounded-xl dark:border-neutral-800 group", className)}>
      <details className="group">
        <summary
          className="flex items-center justify-between w-full px-6 py-4 list-none cursor-pointer font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 transition-colors"
        >
          <span>{question}</span>
          <svg
            className="h-4 w-4 transition-transform duration-300 group-open:rotate-180 text-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-6 pb-4 text-text-secondary text-sm leading-relaxed">
          {answer}
        </div>
      </details>
    </div>
  );
}

FaqItem.displayName = "FaqItem";

/**
 * FaqSection - accordion FAQ section
 */
export interface FaqSectionProps {
  title: string;
  description?: string;
  items: FaqItemProps[];
  className?: string;
  maxWidth?: string;
}

export function FaqSection({
  title,
  description,
  items,
  className,
  maxWidth = "max-w-3xl mx-auto",
}: FaqSectionProps) {
  return (
    <Section className={className} padding="md" bg="subtle">
      <SectionTitle title={title} description={description} textAlign="center" />
      <div className={cn("mt-16 lg:mt-24 space-y-4", maxWidth)}>
        {items.map((item, index) => (
          <FaqItem key={index} {...item} />
        ))}
      </div>
    </Section>
  );
}

FaqSection.displayName = "FaqSection";

/**
 * StatItem - single metric stat
 */
export interface StatItemProps {
  value: string | number;
  label: string;
  change?: string;
  icon?: React.ReactNode;
}

export function StatItem({ value, label, change, icon }: StatItemProps) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
          {icon}
        </div>
      )}
      <p className="text-3xl font-bold text-text-primary tabular-nums">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
      {change && (
        <p className="text-xs font-medium text-brand-600 dark:text-brand-400">{change}</p>
      )}
    </div>
  );
}

StatItem.displayName = "StatItem";

/**
 * StatsSection - metrics highlight section
 */
export interface StatsSectionProps {
  title?: string;
  description?: string;
  stats: StatItemProps[];
  className?: string;
}

export function StatsSection({ title, description, stats, className }: StatsSectionProps) {
  return (
    <Section className={className} padding="md" bg="subtle">
      {title || description && (
        <SectionTitle title={title} description={description} textAlign="center" />
      )}
      <div className={cn("mt-16 lg:mt-24 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8", className && "mt-0")}>
        {stats.map((stat, index) => (
          <StatItem key={index} {...stat} />
        ))}
      </div>
    </Section>
  );
}

StatsSection.displayName = "StatsSection";
