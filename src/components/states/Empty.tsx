"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Empty State Types
 */
export interface EmptyStateProps {
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    icon?: React.ReactNode;
  };
  /**
   * Secondary action
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg" | "full";
  /**
   * Alignment
   */
  align?: "center" | "left";
  /**
   * Custom className
   */
  className?: string;
  /**
   * Illustration type
   */
  illustration?: "default" | "search" | "filter" | "connection" | "celebration";
}

/**
 * Default illustrations
 */
const illustrations = {
  default: (
    <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  filter: (
    <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  connection: (
    <svg className="w-16 h-16 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  celebration: (
    <svg className="w-16 h-16 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

/**
 * Empty State Component
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  align = "center",
  className,
  illustration = "default",
}: EmptyStateProps) {
  const sizeStyles = {
    sm: "py-8 px-4",
    md: "py-12 px-6",
    lg: "py-16 px-8",
    full: "flex-1 flex items-center justify-center p-8",
  };

  const alignStyles = {
    center: "text-center mx-auto max-w-md",
    left: "text-left max-w-md",
  };

  const displayIcon = icon || illustrations[illustration];

  return (
    <div
      className={cn(
        "flex flex-col",
        sizeStyles[size],
        alignStyles[align],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn("mb-4 flex justify-center", align === "left" && "justify-start")}>
        {displayIcon}
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">{title}</h2>
      {description && (
        <p className="text-text-secondary leading-relaxed mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className={cn("flex gap-3 w-full", align === "center" && "justify-center", align === "left" && "justify-start")}>
          {action && (
            <Button
              variant={action.variant || "primary"}
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty State Card - wrapped in a card
 */
export interface EmptyStateCardProps extends EmptyStateProps {
  variant?: "default" | "outlined" | "ghost";
}

export function EmptyStateCard({ variant = "default", className, ...props }: EmptyStateCardProps) {
  return (
    <Card variant={variant} padding="none" className={cn("w-full", className)}>
      <EmptyState {...props} size="md" />
    </Card>
  );
}

/**
 * Pre-built Empty States for common scenarios
 */

// No Data
export function NoDataState({
  title = "No data available",
  description = "There's nothing here yet. Get started by creating your first item.",
  action,
  ...props
}: Omit<EmptyStateProps, "illustration">) {
  return (
    <EmptyState
      title={title}
      description={description}
      illustration="default"
      action={action}
      {...props}
    />
  );
}

// No Results
export function NoResultsState({
  title = "No results found",
  description = "Try adjusting your search or filter criteria.",
  action,
  ...props
}: Omit<EmptyStateProps, "illustration">) {
  return (
    <EmptyState
      title={title}
      description={description}
      illustration="search"
      action={action}
      {...props}
    />
  );
}

// No Connection
export function NoConnectionState({
  title = "No connections yet",
  description = "Start building your network by connecting with others.",
  action,
  ...props
}: Omit<EmptyStateProps, "illustration">) {
  return (
    <EmptyState
      title={title}
      description={description}
      illustration="connection"
      action={action}
      {...props}
    />
  );
}

// First Time
export function FirstTimeState({
  title = "Welcome!",
  description = "Let's get you set up. Take a moment to complete your profile.",
  action,
  ...props
}: Omit<EmptyStateProps, "illustration">) {
  return (
    <EmptyState
      title={title}
      description={description}
      illustration="celebration"
      action={action}
      {...props}
    />
  );
}

// Error Empty State
export function ErrorEmptyState({
  title = "Something went wrong",
  description = "We couldn't load the data. Please try again.",
  action,
  ...props
}: Omit<EmptyStateProps, "illustration">) {
  return (
    <EmptyState
      title={title}
      description={description}
      illustration="default"
      action={action}
      {...props}
    />
  );
}

// Offline State
export function OfflineState({
  title = "You're offline",
  description = "Check your connection and try again. We'll automatically refresh when you're back online.",
  action,
  ...props
}: Omit<EmptyStateProps, "illustration">) {
  return (
    <EmptyState
      title={title}
      description={description}
      illustration="default"
      action={action}
      {...props}
    />
  );
}

// All prop types above are already exported inline.