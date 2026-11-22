"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Avatar Component
// ---------------------------------------------------------------------------

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "square";
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-24 w-24 text-xl",
};

export function Avatar({ src, alt, fallback, size = "md", shape = "circle", className, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden",
        SIZE_CLASSES[size],
        shape === "circle" ? "rounded-full" : "rounded-lg",
        className
      )}
      {...props}
    >
      {src && !imageError && (
        <img
          src={src}
          alt={alt || ""}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
      {showFallback && (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 font-medium",
            SIZE_CLASSES[size]
          )}
          aria-label={alt || "User avatar"}
        >
          {fallback}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AvatarFallback Component
// ---------------------------------------------------------------------------

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
}

export function AvatarFallback({ children, className, ...props }: AvatarFallbackProps) {
  return (
    <span className={cn("flex items-center justify-center", className)} {...props}>
      {children}
    </span>
  );
}