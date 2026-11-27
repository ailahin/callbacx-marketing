"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

/**
 * FeatureCard - premium feature/service card with icon
 */
export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  details?: string[];
  href?: string;
  variant?: "default" | "elevated" | "outlined";
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  details,
  href,
  variant = "default",
  className,
}: FeatureCardProps) {
  return (
    <Card
      asChild={!!href}
      variant={variant}
      className={cn("h-full flex flex-col group", className)}
    >
      {href ? (
        <a
          href={href}
          className="block h-full"
          aria-label={title}
        >
          <FeatureCardContent icon={icon} title={title} description={description} details={details} />
        </a>
      ) : (
        <FeatureCardContent icon={icon} title={title} description={description} details={details} />
      )}
    </Card>
  );
}

function FeatureCardContent({
  icon,
  title,
  description,
  details,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  details?: string[];
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/10 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5 group-hover:shadow-brand transition-shadow duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed flex-1 mb-6">
        {description}
      </p>
      {details && details.length > 0 && (
        <>
          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Included
          </h4>
          <ul className="space-y-2 mb-8 flex-1">
            {details.map((detail, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">—</span>
                {detail}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

FeatureCard.displayName = "FeatureCard";

/**
 * FeatureGrid - responsive grid of feature cards
 */
export interface FeatureGridProps {
  items: FeatureCardProps[];
  className?: string;
  cols?: { base?: number; sm?: number; md?: number; lg?: number };
}

export function FeatureGrid({
  items,
  className,
  cols = { base: 1, sm: 2, lg: 3 },
}: FeatureGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8",
        className
      )}
    >
      {items.map((item, index) => (
        <FeatureCard key={index} {...item} />
      ))}
    </div>
  );
}

FeatureGrid.displayName = "FeatureGrid";
