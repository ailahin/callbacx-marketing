"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button component with multiple variants, sizes, and states
 * Inspired by weaving threads - interconnected, purposeful interactions
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-[0.98]",
    "select-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-brand-600 text-white",
          "hover:bg-brand-700",
          "focus-visible:ring-brand-500 focus-visible:ring-offset-surface",
          "shadow-sm hover:shadow-md",
          "dark:bg-brand-500 dark:hover:bg-brand-400",
          "dark:focus-visible:ring-brand-400 dark:focus-visible:ring-offset-neutral-900",
        ],
        secondary: [
          "bg-neutral-100 text-neutral-900 border border-neutral-300",
          "hover:bg-neutral-200 hover:border-neutral-400",
          "focus-visible:ring-neutral-400 focus-visible:ring-offset-surface",
          "dark:bg-neutral-800 dark:text-neutral-50 dark:border-neutral-700",
          "dark:hover:bg-neutral-700 dark:hover:border-neutral-600",
          "dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900",
        ],
        outline: [
          "bg-transparent text-brand-600 border-2 border-brand-600",
          "hover:bg-brand-50 hover:text-brand-700",
          "focus-visible:ring-brand-500 focus-visible:ring-offset-surface",
          "dark:text-brand-400 dark:border-brand-400",
          "dark:hover:bg-brand-950 dark:hover:text-brand-300",
          "dark:focus-visible:ring-brand-400 dark:focus-visible:ring-offset-neutral-900",
        ],
        ghost: [
          "bg-transparent text-neutral-700",
          "hover:bg-neutral-100 hover:text-neutral-900",
          "focus-visible:ring-neutral-400 focus-visible:ring-offset-surface",
          "dark:text-neutral-300",
          "dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
          "dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900",
        ],
        destructive: [
          "bg-error-600 text-white",
          "hover:bg-error-700",
          "focus-visible:ring-error-500 focus-visible:ring-offset-surface",
          "shadow-sm hover:shadow-md",
          "dark:bg-error-500 dark:hover:bg-error-400",
          "dark:focus-visible:ring-error-400 dark:focus-visible:ring-offset-neutral-900",
        ],
        accent: [
          "bg-accent-600 text-white",
          "hover:bg-accent-700",
          "focus-visible:ring-accent-500 focus-visible:ring-offset-surface",
          "shadow-sm hover:shadow-md",
          "dark:bg-accent-500 dark:hover:bg-accent-400",
          "dark:focus-visible:ring-accent-400 dark:focus-visible:ring-offset-neutral-900",
        ],
        success: [
          "bg-success-600 text-white",
          "hover:bg-success-700",
          "focus-visible:ring-success-500 focus-visible:ring-offset-surface",
          "shadow-sm hover:shadow-md",
          "dark:bg-success-500 dark:hover:bg-success-400",
          "dark:focus-visible:ring-success-400 dark:focus-visible:ring-offset-neutral-900",
        ],
        link: [
          "bg-transparent text-brand-600 underline-offset-4 hover:underline",
          "focus-visible:ring-brand-500 focus-visible:ring-offset-surface",
          "dark:text-brand-400",
          "dark:focus-visible:ring-brand-400 dark:focus-visible:ring-offset-neutral-900",
        ],
      },
      size: {
        xs: "h-7 px-2.5 text-xs gap-1.5",
        sm: "h-9 px-3 text-sm gap-1.5",
        md: "h-10 px-4 text-base gap-2",
        lg: "h-12 px-6 text-lg gap-2",
        xl: "h-14 px-8 text-xl gap-2.5",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
      loading: {
        true: "relative text-transparent",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        loading: true,
        className: "focus-visible:ring-brand-500",
      },
      {
        variant: "secondary",
        loading: true,
        className: "focus-visible:ring-neutral-400",
      },
      {
        variant: "outline",
        loading: true,
        className: "focus-visible:ring-brand-500 border-brand-600",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      radius: "lg",
      fullWidth: false,
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Show loading spinner
   */
  loading?: boolean;
  /**
   * Button content when loading (defaults to spinner)
   */
  loadingContent?: React.ReactNode;
  /**
   * Icon to show before content
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to show after content
   */
  rightIcon?: React.ReactNode;
  /**
   * Render as different element (e.g., 'a' for links)
   */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      radius,
      fullWidth,
      loading,
      loadingContent,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild,
      ...props
    },
    ref
  ) => {
    const isLoading = loading || props["aria-busy"] === "true";

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, radius, fullWidth, loading: isLoading }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            <span className="sr-only">Loading...</span>
            {loadingContent && <span>{loadingContent}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * ButtonGroup - for grouping related buttons
 */
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  vertical?: boolean;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, children, vertical, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex",
          vertical ? "flex-col" : "flex-row",
          "rounded-lg overflow-hidden shadow-sm",
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          const childEl = child as React.ReactElement<{ className?: string }>;
          return React.cloneElement(childEl, {
            className: cn(
              childEl.props.className,
              "rounded-none",
              !vertical &&
                index > 0 &&
                "border-l-0 rtl:border-r-0",
              vertical &&
                index > 0 &&
                "border-t-0",
              "focus-visible:z-10"
            ),
          });
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";

/**
 * IconButton - minimal button for icon-only actions
 */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", "aria-label": ariaLabel, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center transition-colors duration-150";
    
    const variantStyles = {
      default: "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-50 dark:hover:bg-neutral-800",
      ghost: "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800",
      subtle: "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-800",
    };

    const sizeStyles = {
      sm: "h-8 w-8 rounded-md",
      md: "h-10 w-10 rounded-lg",
      lg: "h-12 w-12 rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export type { ButtonGroupProps, IconButtonProps };