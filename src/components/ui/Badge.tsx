"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge component - small status indicators and labels
 * Like threads marking connections in a woven tapestry
 */

export const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5",
    "font-medium transition-colors duration-150",
    "select-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-neutral-100 text-neutral-700 border border-neutral-200",
          "dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        ],
        primary: [
          "bg-brand-100 text-brand-800 border border-brand-200",
          "dark:bg-brand-900/50 dark:text-brand-300 dark:border-brand-800",
        ],
        secondary: [
          "bg-accent-100 text-accent-800 border border-accent-200",
          "dark:bg-accent-900/50 dark:text-accent-300 dark:border-accent-800",
        ],
        success: [
          "bg-success-100 text-success-800 border border-success-200",
          "dark:bg-success-900/50 dark:text-success-300 dark:border-success-800",
        ],
        warning: [
          "bg-warning-100 text-warning-800 border border-warning-200",
          "dark:bg-warning-900/50 dark:text-warning-300 dark:border-warning-800",
        ],
        error: [
          "bg-error-100 text-error-800 border border-error-200",
          "dark:bg-error-900/50 dark:text-error-300 dark:border-error-800",
        ],
        info: [
          "bg-info-100 text-info-800 border border-info-200",
          "dark:bg-info-900/50 dark:text-info-300 dark:border-info-800",
        ],
        outline: [
          "bg-transparent text-neutral-700 border-2 border-neutral-300",
          "dark:text-neutral-300 dark:border-neutral-600",
        ],
        ghost: [
          "bg-transparent text-neutral-600",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        ],
        dot: [
          "bg-transparent text-neutral-700 px-2",
          "dark:text-neutral-300",
        ],
      },
      size: {
        xs: "px-2 py-0.5 text-[10px] leading-none gap-1 rounded",
        sm: "px-2.5 py-1 text-xs leading-none gap-1 rounded-md",
        md: "px-3 py-1 text-sm leading-none gap-1.5 rounded-lg",
        lg: "px-4 py-1.5 text-base leading-none gap-2 rounded-xl",
      },
      tone: {
        solid: "",
        soft: "",
        outline: "",
      },
    },
    compoundVariants: [
      {
        variant: "dot",
        size: "xs",
        className: "px-1.5 gap-1",
      },
      {
        variant: "dot",
        size: "sm",
        className: "px-2 gap-1.5",
      },
      {
        variant: "dot",
        size: "md",
        className: "px-2.5 gap-2",
      },
      {
        variant: "dot",
        size: "lg",
        className: "px-3 gap-2.5",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      tone: "solid",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Show as dot indicator instead of full badge
   */
  dot?: boolean;
  /**
   * Dot color (when using dot variant)
   */
  dotColor?: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";
  /**
   * Icon to show before content
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to show after content
   */
  rightIcon?: React.ReactNode;
  /**
   * Whether badge is removable
   */
  removable?: boolean;
  /**
   * Callback when removed
   */
  onRemove?: () => void;
  /**
   * Accessible label for remove button
   */
  removeAriaLabel?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      tone,
      dot,
      dotColor = "default",
      leftIcon,
      rightIcon,
      removable,
      onRemove,
      removeAriaLabel = "Remove",
      children,
      ...props
    },
    ref
  ) => {
    if (dot) {
      const dotColors = {
        default: "bg-neutral-400 dark:bg-neutral-500",
        primary: "bg-brand-500",
        secondary: "bg-accent-500",
        success: "bg-success-500",
        warning: "bg-warning-500",
        error: "bg-error-500",
        info: "bg-info-500",
      };

      const dotSizes = {
        xs: "w-1.5 h-1.5",
        sm: "w-2 h-2",
        md: "w-2.5 h-2.5",
        lg: "w-3 h-3",
      };

      return (
        <span
          ref={ref}
          className={cn(
            "inline-flex items-center gap-1.5",
            badgeVariants({ variant: "dot", size }),
            className
          )}
          {...props}
        >
          <span
            className={cn("rounded-full flex-shrink-0", dotSizes[size ?? "md"], dotColors[dotColor])}
            aria-hidden="true"
          />
          {children}
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
        {removable && (
          <button
            type="button"
            className={cn(
              "ml-1 flex items-center justify-center rounded-full transition-colors",
              "hover:bg-black/10 dark:hover:bg-white/10",
              size === "xs" && "w-3.5 h-3.5",
              size === "sm" && "w-4 h-4",
              size === "md" && "w-5 h-5",
              size === "lg" && "w-6 h-6"
            )}
            onClick={onRemove}
            aria-label={removeAriaLabel}
          >
            <svg
              className={cn(
                "stroke-current",
                size === "xs" && "w-2.5 h-2.5",
                size === "sm" && "w-3 h-3",
                size === "md" && "w-3.5 h-3.5",
                size === "lg" && "w-4 h-4"
              )}
              fill="none"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";

/**
 * StatusBadge - specialized badge for status indicators
 */
export interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "processing" | "completed" | "failed" | "draft" | "archived";
  size?: "xs" | "sm" | "md" | "lg";
  showDot?: boolean;
  label?: string;
  className?: string;
}

const statusConfig = {
  active: { variant: "success" as const, dotColor: "success" as const, label: "Active" },
  inactive: { variant: "default" as const, dotColor: "default" as const, label: "Inactive" },
  pending: { variant: "warning" as const, dotColor: "warning" as const, label: "Pending" },
  processing: { variant: "info" as const, dotColor: "info" as const, label: "Processing" },
  completed: { variant: "success" as const, dotColor: "success" as const, label: "Completed" },
  failed: { variant: "error" as const, dotColor: "error" as const, label: "Failed" },
  draft: { variant: "secondary" as const, dotColor: "secondary" as const, label: "Draft" },
  archived: { variant: "outline" as const, dotColor: "default" as const, label: "Archived" },
};

export function StatusBadge({
  status,
  size = "md",
  showDot = true,
  label,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showDot}
      dotColor={config.dotColor}
      className={className}
    >
      {displayLabel}
    </Badge>
  );
}

/**
 * Tag - filter/interactive tag component
 */
export interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onSelect"> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  removable?: boolean;
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      selected,
      onSelect,
      removable,
      onRemove,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseVariants = {
      default: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
      primary: "bg-brand-100 text-brand-800 border-brand-200 dark:bg-brand-900/50 dark:text-brand-300 dark:border-brand-800",
      secondary: "bg-accent-100 text-accent-800 border-accent-200 dark:bg-accent-900/50 dark:text-accent-300 dark:border-accent-800",
      success: "bg-success-100 text-success-800 border-success-200 dark:bg-success-900/50 dark:text-success-300 dark:border-success-800",
      warning: "bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-900/50 dark:text-warning-300 dark:border-warning-800",
      error: "bg-error-100 text-error-800 border-error-200 dark:bg-error-900/50 dark:text-error-300 dark:border-error-800",
      info: "bg-info-100 text-info-800 border-info-200 dark:bg-info-900/50 dark:text-info-300 dark:border-info-800",
    };

    const selectedVariants = {
      default: "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-50 dark:text-neutral-950 dark:border-neutral-50",
      primary: "bg-brand-600 text-white border-brand-600 dark:bg-brand-500 dark:border-brand-500",
      secondary: "bg-accent-600 text-white border-accent-600 dark:bg-accent-500 dark:border-accent-500",
      success: "bg-success-600 text-white border-success-600 dark:bg-success-500 dark:border-success-500",
      warning: "bg-warning-600 text-white border-warning-600 dark:bg-warning-500 dark:border-warning-500",
      error: "bg-error-600 text-white border-error-600 dark:bg-error-500 dark:border-error-500",
      info: "bg-info-600 text-white border-info-600 dark:bg-info-500 dark:border-info-500",
    };

    const sizeStyles = {
      sm: "px-2.5 py-0.5 text-xs gap-1 rounded-md",
      md: "px-3 py-1 text-sm gap-1.5 rounded-lg",
      lg: "px-4 py-1.5 text-base gap-2 rounded-xl",
    };

    const handleClick = () => {
      if (onSelect) {
        onSelect(!selected);
      }
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150",
          "border",
          "cursor-pointer select-none",
          selected ? selectedVariants[variant] : baseVariants[variant],
          sizeStyles[size],
          removable && "pr-1",
          className
        )}
        onClick={onSelect ? handleClick : undefined}
        aria-pressed={selected ? "true" : onSelect ? "false" : undefined}
        {...props}
      >
        {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
        {children}
        {rightIcon && !removable && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
        {removable && (
          <button
            type="button"
            className={cn(
              "ml-1 flex items-center justify-center rounded-full transition-colors",
              "hover:bg-black/10 dark:hover:bg-white/10",
              size === "sm" && "w-4 h-4",
              size === "md" && "w-5 h-5",
              size === "lg" && "w-6 h-6"
            )}
            onClick={handleRemove}
            aria-label="Remove tag"
          >
            <svg
              className={cn(
                "stroke-current",
                size === "sm" && "w-3 h-3",
                size === "md" && "w-3.5 h-3.5",
                size === "lg" && "w-4 h-4"
              )}
              fill="none"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = "Tag";

/**
 * TagGroup - manages multiple tags with selection
 */
export interface TagGroupProps {
  tags: Array<{ value: string; label: string }>;
  selected?: string[];
  onChange?: (selected: string[]) => void;
  multiple?: boolean;
  variant?: TagProps["variant"];
  size?: TagProps["size"];
  className?: string;
}

export function TagGroup({
  tags,
  selected = [],
  onChange,
  multiple = true,
  variant = "default",
  size = "md",
  className,
}: TagGroupProps) {
  const handleSelect = (value: string, currentlySelected: boolean) => {
    let newSelected: string[];
    if (multiple) {
      newSelected = currentlySelected
        ? selected.filter((v) => v !== value)
        : [...selected, value];
    } else {
      newSelected = currentlySelected ? [] : [value];
    }
    onChange?.(newSelected);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label="Tag group">
      {tags.map((tag) => (
        <Tag
          key={tag.value}
          variant={variant}
          size={size}
          selected={selected.includes(tag.value)}
          onSelect={(isSelected) => handleSelect(tag.value, isSelected)}
        >
          {tag.label}
        </Tag>
      ))}
    </div>
  );
}

/**
 * CountBadge - badge with numeric count
 */
export interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeProps["variant"];
  size?: BadgeProps["size"];
  showZero?: boolean;
  className?: string;
}

export function CountBadge({
  count,
  max = 99,
  variant = "primary",
  size = "md",
  showZero = false,
  className,
}: CountBadgeProps) {
  if (count <= 0 && !showZero) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant={variant} size={size} className={cn("font-mono tabular-nums", className)}>
      {displayCount}
    </Badge>
  );
}

// All prop types above are already exported inline.