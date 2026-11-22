"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Card component - versatile container for grouped content
 * Inspired by woven fabric - individual threads creating cohesive surfaces
 */

const cardVariants = cva(
  [
    "rounded-2xl transition-all duration-200 ease-out",
    "bg-surface border border-border-subtle",
    "dark:border-neutral-800",
  ],
  {
    variants: {
      variant: {
        default: "shadow-sm hover:shadow-md",
        elevated: "shadow-lg hover:shadow-xl",
        outlined: "border-border-default shadow-none hover:shadow-sm",
        filled: "bg-surface-subtle border-none shadow-none hover:shadow-sm",
        ghost: "bg-transparent border-none shadow-none hover:bg-surface-subtle",
        interactive: [
          "cursor-pointer",
          "shadow-sm hover:shadow-lg",
          "active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        ],
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      hover: {
        true: "hover:-translate-y-0.5 hover:shadow-lg",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "ghost",
        hover: true,
        className: "hover:bg-surface-subtle hover:shadow-none hover:translate-y-0",
      },
      {
        variant: "filled",
        hover: true,
        className: "hover:bg-surface-hover hover:shadow-md hover:-translate-y-0.5",
      },
    ],
    defaultVariants: {
      variant: "default",
      padding: "md",
      hover: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Render as different element
   */
  as?: React.ElementType;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, as: Component = "div", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(cardVariants({ variant, padding, hover }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";

/**
 * CardHeader - consistent header section
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between gap-4 mb-4", className)}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-text-primary leading-snug">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-text-secondary leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
        {action && <div className="flex-shrink-0 mt-0.5">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

/**
 * CardTitle - standalone title component
 */
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-lg font-semibold text-text-primary leading-snug", className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

/**
 * CardDescription - standalone description component
 */
export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-text-secondary leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

/**
 * CardContent - main content area
 */
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

/**
 * CardFooter - footer with actions
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divided?: boolean;
  children?: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, divided, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 mt-4 pt-4",
          divided && "border-t border-border-subtle dark:border-neutral-800",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

/**
 * CardMedia - for images/media at top of card
 */
export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  aspectRatio?: "square" | "video" | "portrait" | "golden" | "auto";
  fit?: "cover" | "contain" | "fill";
}

export const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ className, src, alt, aspectRatio = "video", fit = "cover", children, ...props }, ref) => {
    const aspectStyles = {
      square: "aspect-square",
      video: "aspect-video",
      portrait: "aspect-portrait",
      golden: "aspect-golden",
      auto: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-t-2xl",
          aspectStyles[aspectRatio],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || ""}
            className={cn(
              "w-full h-full object-center transition-transform duration-300",
              fit === "cover" && "object-cover",
              fit === "contain" && "object-contain",
              fit === "fill" && "object-fill"
            )}
            loading="lazy"
          />
        ) : (
          children
        )}
      </div>
    );
  }
);

CardMedia.displayName = "CardMedia";

/**
 * CardOverlay - overlay for media cards
 */
export interface CardOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top" | "bottom" | "center" | "full";
}

export const CardOverlay = React.forwardRef<HTMLDivElement, CardOverlayProps>(
  ({ className, position = "bottom", children, ...props }, ref) => {
    const positionStyles = {
      top: "absolute top-0 left-0 right-0 p-4",
      bottom: "absolute bottom-0 left-0 right-0 p-4",
      center: "absolute inset-0 p-6 flex items-center justify-center",
      full: "absolute inset-0 p-6 flex flex-col justify-between",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent text-white",
          positionStyles[position],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardOverlay.displayName = "CardOverlay";

/**
 * CardGrid - responsive grid layout for cards
 */
export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | { base: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: "sm" | "md" | "lg" | "xl";
}

export const CardGrid = React.forwardRef<HTMLDivElement, CardGridProps>(
  ({ className, columns = 3, gap = "md", children, ...props }, ref) => {
    const gapStyles = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    };

    let gridCols = "grid-cols-1";
    if (typeof columns === "number") {
      gridCols = `sm:grid-cols-2 lg:grid-cols-${columns}`;
    } else {
      gridCols = `grid-cols-${columns.base} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`;
    }

    return (
      <div
        ref={ref}
        className={cn("grid", gridCols, gapStyles[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardGrid.displayName = "CardGrid";

/**
 * CardList - vertical list layout for cards
 */
export const CardList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { divided?: boolean }>(
  ({ className, children, divided = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col", divided && "divide-y divide-border-subtle dark:divide-neutral-800", className)}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          const childEl = child as React.ReactElement<{ className?: string }>;
          return React.cloneElement(childEl, {
            className: cn(
              childEl.props.className,
              "rounded-none border-0 shadow-none",
              index === 0 && "rounded-t-2xl",
              index === React.Children.count(children) - 1 && "rounded-b-2xl"
            ),
          });
        })}
      </div>
    );
  }
);

CardList.displayName = "CardList";

/**
 * StatCard - specialized card for metrics/KPIs
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  value: string | number;
  label: string;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({
    className,
    value,
    label,
    change,
    changeType = "neutral",
    icon,
    trend,
    variant = "default",
    padding = "md",
    ...props
  }, ref) => {
    const changeColors = {
      increase: "text-success-600 dark:text-success-400",
      decrease: "text-error-600 dark:text-error-400",
      neutral: "text-text-tertiary",
    };

    const changeIcons = {
      increase: (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      decrease: (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      neutral: (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      ),
    };

    return (
      <Card ref={ref} variant={variant} padding={padding} className={className} {...props}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-secondary truncate">{label}</p>
            <p className="mt-1 text-3xl font-bold text-text-primary tabular-nums">{value}</p>
            {(change || trend) && (
              <div className="mt-2 flex items-center gap-1.5">
                {trend || changeIcons[changeType]}
                {change && (
                  <span className={cn("text-sm font-medium", changeColors[changeType])}>
                    {change}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 p-3 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              {icon}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

/**
 * ProfileCard - specialized card for user/profile display
 */
export interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  name: string;
  role?: string;
  avatar?: string;
  avatarFallback?: string;
  email?: string;
  bio?: string;
  actions?: React.ReactNode;
  metadata?: Array<{ label: string; value: string }>;
}

export const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({
    className,
    name,
    role,
    avatar,
    avatarFallback,
    email,
    bio,
    actions,
    metadata,
    variant = "default",
    padding = "lg",
    ...props
  }, ref) => {
    const initials = avatarFallback || name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
      <Card ref={ref} variant={variant} padding={padding} className={className} {...props}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50">
                {initials}
              </div>
            )}
          </div>
          <div className="w-full">
            <h3 className="text-xl font-bold text-text-primary">{name}</h3>
            {role && <p className="text-sm text-text-secondary mt-0.5">{role}</p>}
            {email && <p className="text-sm text-text-tertiary mt-0.5 truncate">{email}</p>}
            {bio && <p className="text-sm text-text-secondary mt-3 leading-relaxed">{bio}</p>}
            {metadata && metadata.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
                {metadata.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="text-text-tertiary">{item.label}</span>
                    <span className="font-medium text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            {actions && <div className="mt-4 w-full">{actions}</div>}
          </div>
        </div>
      </Card>
    );
  }
);

ProfileCard.displayName = "ProfileCard";

// All prop types above are already exported inline.