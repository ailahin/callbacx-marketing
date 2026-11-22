"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Loading States
 */

export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "brand" | "accent" | "white";
  className?: string;
  "aria-label"?: string;
}

export function Spinner({
  size = "md",
  variant = "default",
  className,
  "aria-label": ariaLabel = "Loading",
}: SpinnerProps) {
  const sizeStyles = {
    xs: "h-3 w-3 border-[2px]",
    sm: "h-4 w-4 border-[2px]",
    md: "h-6 w-6 border-[2.5px]",
    lg: "h-8 w-8 border-[3px]",
    xl: "h-12 w-12 border-[4px]",
  };

  const variantStyles = {
    default: "border-neutral-300 border-t-brand-600 dark:border-neutral-700 dark:border-t-brand-400",
    brand: "border-brand-200 border-t-brand-600 dark:border-brand-800 dark:border-t-brand-400",
    accent: "border-accent-200 border-t-accent-600 dark:border-accent-800 dark:border-t-accent-400",
    white: "border-white/30 border-t-white",
  };

  return (
    <svg
      className={cn(
        "animate-spin rounded-full",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel}
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Loading Dots - alternative spinner
 */
export interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: "default" | "brand" | "accent" | "white";
  className?: string;
}

export function LoadingDots({ size = "md", color = "default", className }: LoadingDotsProps) {
  const sizeStyles = {
    sm: "h-1.5 w-1.5",
    md: "h-2.5 w-2.5",
    lg: "h-3.5 w-3.5",
  };

  const colorStyles = {
    default: "bg-neutral-400 dark:bg-neutral-500",
    brand: "bg-brand-500",
    accent: "bg-accent-500",
    white: "bg-white",
  };

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full animate-bounce",
            sizeStyles[size],
            colorStyles[color]
          )}
          style={{ animationDelay: `${i * 150}ms` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Loader - for content placeholders
 */
export interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
  spacing?: number;
}

export function Skeleton({
  variant = "text",
  width = "100%",
  height,
  className,
  count = 1,
  spacing = 12,
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded";

  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl",
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
        marginBottom: i < count - 1 ? spacing : 0,
      }}
      aria-hidden="true"
    />
  ));

  return <div className="space-y-2">{items}</div>;
}

/**
 * Skeleton Card - complete card skeleton
 */
export interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({ className, showImage = true, showAvatar = false, lines = 3 }: SkeletonCardProps) {
  return (
    <Card variant="default" padding="none" className={cn("overflow-hidden", className)}>
      {showImage && (
        <div className="aspect-video bg-neutral-200 dark:bg-neutral-700 animate-pulse" aria-hidden="true" />
      )}
      <div className="p-4 space-y-3">
        {showAvatar && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" aria-hidden="true" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" aria-hidden="true" />
              <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" aria-hidden="true" />
            </div>
          </div>
        )}
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              "bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse",
              i === lines - 1 ? "h-4 w-5/6" : "h-4"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    </Card>
  );
}

/**
 * Page Loader - full page loading state
 */
export interface PageLoaderProps {
  message?: string;
  subMessage?: string;
  showSpinner?: boolean;
  className?: string;
}

export function PageLoader({ message = "Loading...", subMessage, showSpinner = true, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-modal flex items-center justify-center p-4",
        "bg-surface/90 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="text-center space-y-4 max-w-sm">
        {showSpinner && <Spinner size="lg" variant="brand" />}
        <div>
          <p className="text-lg font-medium text-text-primary">{message}</p>
          {subMessage && (
            <p className="mt-1 text-sm text-text-secondary">{subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Button Loading State
 */
export interface ButtonLoadingProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent" | "success" | "link";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export function ButtonLoading({ loading, loadingText = "Loading...", children, disabled, className, ...props }: ButtonLoadingProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" variant="white" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Lazy Load Wrapper
 */
export interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazyLoad({ children, fallback, threshold = 0.1, rootMargin = "100px", className }: LazyLoadProps) {
  const [visible, setVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={elementRef} className={className}>
      {visible ? children : (fallback || <Skeleton variant="rectangular" height={200} />)}
    </div>
  );
}

// All prop types above are already exported inline.