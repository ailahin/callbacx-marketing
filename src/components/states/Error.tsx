"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/Button";

/**
 * Error State Types
 */
export interface ErrorStateProps {
  /**
   * Error title
   */
  title?: string;
  /**
   * Error message
   */
  message: string;
  /**
   * Error code (optional)
   */
  code?: string | number;
  /**
   * Retry action
   */
  onRetry?: () => void;
  /**
   * Retry button label
   */
  retryLabel?: string;
  /**
   * Dismiss action
   */
  onDismiss?: () => void;
  /**
   * Show dismiss button
   */
  dismissible?: boolean;
  /**
   * Variant
   */
  variant?: "inline" | "card" | "page" | "toast" | "banner";
  /**
   * Severity
   */
  severity?: "error" | "warning" | "info";
  /**
   * Custom className
   */
  className?: string;
  /**
   * Additional details (shown in expandable section)
   */
  details?: string;
  /**
   * Show report button
   */
  showReport?: boolean;
  /**
   * Report action
   */
  onReport?: () => void;
}

/**
 * Error Icons
 */
const errorIcons = {
  error: (
    <svg className="w-10 h-10 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  warning: (
    <svg className="w-10 h-10 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-10 h-10 text-info-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const severityColors = {
  error: {
    bg: "bg-error-50 dark:bg-error-950/50",
    border: "border-error-200 dark:border-error-800",
    text: "text-error-700 dark:text-error-300",
    title: "text-error-900 dark:text-error-100",
  },
  warning: {
    bg: "bg-warning-50 dark:bg-warning-950/50",
    border: "border-warning-200 dark:border-warning-800",
    text: "text-warning-700 dark:text-warning-300",
    title: "text-warning-900 dark:text-warning-100",
  },
  info: {
    bg: "bg-info-50 dark:bg-info-950/50",
    border: "border-info-200 dark:border-info-800",
    text: "text-info-700 dark:text-info-300",
    title: "text-info-900 dark:text-info-100",
  },
};

/**
 * Error State Component
 */
export function ErrorState({
  title,
  message,
  code,
  onRetry,
  retryLabel = "Try again",
  onDismiss,
  dismissible = false,
  variant = "inline",
  severity = "error",
  className,
  details,
  showReport = false,
  onReport,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const colors = severityColors[severity];
  const icon = errorIcons[severity];

  const defaultTitles = {
    error: "Something went wrong",
    warning: "Warning",
    info: "Information",
  };

  const displayTitle = title || defaultTitles[severity];

  const renderContent = () => (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="flex-shrink-0" aria-hidden="true">{icon}</div>
      <div>
        <h2 className={cn("text-lg font-semibold", colors.title)}>{displayTitle}</h2>
        {code && (
          <p className={cn("mt-1 text-sm font-mono", colors.text)}>
            Error code: {code}
          </p>
        )}
        <p className={cn("mt-2 text-base leading-relaxed", colors.text)}>{message}</p>
      </div>
      {details && (
        <details className="w-full max-w-md text-left">
          <summary className={cn("cursor-pointer text-sm font-medium", colors.text)}>
            Show details
          </summary>
          <pre className={cn(
            "mt-2 p-3 text-xs overflow-x-auto rounded bg-neutral-100 dark:bg-neutral-800",
            colors.border
          )}>
            {details}
          </pre>
        </details>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {onRetry && (
          <Button variant="primary" onClick={onRetry} leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }>
            {retryLabel}
          </Button>
        )}
        {showReport && onReport && (
          <Button variant="ghost" onClick={onReport}>
            Report issue
          </Button>
        )}
        {dismissible && onDismiss && (
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Dismiss"
            onClick={onDismiss}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        )}
      </div>
    </div>
  );

  switch (variant) {
    case "card":
      return (
        <Card
          variant="outlined"
          className={cn(colors.bg, colors.border, className)}
          role="alert"
          aria-live="polite"
        >
          <div className="p-6">{renderContent()}</div>
        </Card>
      );

    case "page":
      return (
        <div
          className={cn(
            "flex min-h-[60vh] items-center justify-center p-8",
            className
          )}
          role="alert"
          aria-live="polite"
        >
          <div className="max-w-md w-full">{renderContent()}</div>
        </div>
      );

    case "toast":
      return (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-toast max-w-sm",
            "animate-slide-in-right",
            colors.bg,
            colors.border,
            "border shadow-xl rounded-xl p-4",
            className
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0" aria-hidden="true">
              {severity === "error" && errorIcons.error}
              {severity === "warning" && errorIcons.warning}
              {severity === "info" && errorIcons.info}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium", colors.title)}>{displayTitle}</p>
              <p className={cn("mt-1 text-sm", colors.text)}>{message}</p>
            </div>
            {dismissible && onDismiss && (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Dismiss"
                onClick={onDismiss}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            )}
          </div>
        </div>
      );

    case "banner":
      return (
        <div
          className={cn(
            "w-full border-b",
            colors.bg,
            colors.border,
            "border",
            className
          )}
          role="alert"
          aria-live="polite"
        >
          <div className="mx-auto max-w-[80rem] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</div>
              <div className="flex-1">
                <p className={cn("font-medium", colors.title)}>{displayTitle}</p>
                <p className={cn("mt-0.5 text-sm", colors.text)}>{message}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {onRetry && (
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    {retryLabel}
                  </Button>
                )}
                {dismissible && onDismiss && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Dismiss"
                    onClick={onDismiss}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </IconButton>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    default: // inline
      return (
        <div
          className={cn(
            "flex flex-col items-center gap-4 p-6",
            colors.bg,
            colors.border,
            "border rounded-xl",
            className
          )}
          role="alert"
          aria-live="polite"
        >
          {renderContent()}
        </div>
      );
  }
}

/**
 * Inline Error - for form fields
 */
export interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm text-error-600 dark:text-error-400",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

/**
 * Error Boundary Fallback
 */
export interface ErrorBoundaryFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
  fallback?: React.ReactNode;
}

export function ErrorBoundaryFallback({ error, resetErrorBoundary, fallback }: ErrorBoundaryFallbackProps) {
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <ErrorState
      variant="page"
      title="Something went wrong"
      message={error?.message || "An unexpected error occurred. Please try again."}
      code={error?.name}
      onRetry={resetErrorBoundary}
      retryLabel="Reload page"
      showReport
      onReport={() => {
        console.error("Error reported:", error);
        // Could integrate with error reporting service
      }}
      details={error?.stack}
    />
  );
}

// All prop types above are already exported inline.