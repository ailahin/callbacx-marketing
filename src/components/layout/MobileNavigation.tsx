"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Mobile Navigation Types
 */
export interface MobileNavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: MobileNavItem[];
  disabled?: boolean;
  external?: boolean;
}

export interface MobileNavSection {
  title?: string;
  items: MobileNavItem[];
}

export interface MobileNavigationProps {
  /**
   * Navigation sections
   */
  sections: MobileNavSection[];
  /**
   * Trigger button content
   */
  trigger?: React.ReactNode;
  /**
   * Trigger aria-label
   */
  triggerAriaLabel?: string;
  /**
   * Header content in drawer
   */
  header?: React.ReactNode;
  /**
   * Footer content in drawer
   */
  footer?: React.ReactNode;
  /**
   * Drawer position
   */
  side?: "left" | "right";
  /**
   * Drawer width
   */
  width?: "sm" | "md" | "lg" | "full";
  /**
   * Show backdrop
   */
  backdrop?: boolean;
  /**
   * Close on item click
   */
  closeOnSelect?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Sheet Component (Drawer/Modal)
 */
const Sheet = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }
>(({ open, onOpenChange, children, className, ...props }, ref) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  const handleOverlayClick = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal-backdrop flex items-center justify-center" ref={overlayRef}>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={cn(
          "relative z-modal w-full max-h-[90vh] overflow-y-auto bg-surface shadow-2xl animate-slide-in-right",
          "rounded-t-lg sm:rounded-xl",
          className
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
});

Sheet.displayName = "Sheet";

const SheetTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SheetTrigger.displayName = "SheetTrigger";

const SheetContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        {children}
      </div>
    );
  }
);
SheetContent.displayName = "SheetContent";

const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col space-y-2 p-6 border-b border-border-subtle", className)} {...props}>
        {children}
      </div>
    );
  }
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2 ref={ref} className={cn("text-lg font-semibold text-text-primary", className)} {...props}>
        {children}
      </h2>
    );
  }
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn("text-sm text-text-secondary", className)} {...props}>
        {children}
      </p>
    );
  }
);
SheetDescription.displayName = "SheetDescription";

const SheetClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg",
          "text-text-tertiary hover:text-text-primary",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "transition-colors focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand-500",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    );
  }
);
SheetClose.displayName = "SheetClose";

/**
 * Mobile Navigation Component
 */
export function MobileNavigation({
  sections,
  trigger,
  triggerAriaLabel = "Open navigation menu",
  header,
  footer,
  side = "left",
  width = "lg",
  backdrop = true,
  closeOnSelect = true,
  className,
}: MobileNavigationProps) {
  const [open, setOpen] = React.useState(false);

  const widthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "max-w-full",
  };

  const sideStyles = side === "left" 
    ? "left-0 animate-slide-in-left" 
    : "right-0 animate-slide-in-right";

  return (
    <>
      <SheetTrigger
        className="md:hidden"
        aria-label={triggerAriaLabel}
        onClick={() => setOpen(true)}
      >
        {trigger || (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </SheetTrigger>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          className={cn(
            widthStyles[width],
            sideStyles,
            "h-full flex flex-col",
            className
          )}
        >
          <SheetHeader>
            {header || (
              <>
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Main menu navigation</SheetDescription>
              </>
            )}
            <SheetClose onClick={() => setOpen(false)} aria-label="Close navigation menu" />
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto p-4 space-y-6" aria-label="Mobile navigation">
            {sections.map((section, sectionIndex) => (
              <MobileNavSection key={sectionIndex} section={section} onSelect={() => closeOnSelect && setOpen(false)} />
            ))}
          </nav>

          {footer && (
            <div className="p-4 border-t border-border-subtle">
              {footer}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * Mobile Nav Section Component
 */
function MobileNavSection({ section, onSelect }: { section: MobileNavSection; onSelect: () => void }) {
  return (
    <div className="space-y-2">
      {section.title && (
        <h3 className="px-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {section.title}
        </h3>
      )}
      <ul className="space-y-1" role="list">
        {section.items.map((item, itemIndex) => (
          <MobileNavItem key={itemIndex} item={item} onSelect={onSelect} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Mobile Nav Item Component
 */
function MobileNavItem({ item, onSelect }: { item: MobileNavItem; onSelect: () => void }) {
  const { label, href, onClick, icon, badge, children, disabled, external } = item;
  const [expanded, setExpanded] = React.useState(false);

  const handleClick = () => {
    onClick?.();
    onSelect();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (children && children.length > 0) {
        setExpanded(!expanded);
      } else {
        handleClick();
      }
    }
  };

  if (children && children.length > 0) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-full px-3 py-3 rounded-lg text-base font-medium transition-colors",
            "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-expanded={expanded}
          aria-disabled={disabled}
        >
          <span className="flex items-center gap-3">
            {icon && <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">{icon}</span>}
            {label}
            {badge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-mono bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                {badge}
              </span>
            )}
          </span>
          <svg
            className={cn("h-5 w-5 flex-shrink-0 text-text-tertiary transition-transform", expanded && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && (
          <ul className="mt-1 ml-6 border-l-2 border-border-subtle space-y-1 animate-slide-in-top" role="list">
            {children.map((child, childIndex) => (
              <MobileNavItem key={childIndex} item={child} onSelect={onSelect} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (href) {
    return (
      <li>
        <a
          href={href}
          onClick={handleClick}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-base font-medium transition-colors",
            "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            disabled && "opacity-50 pointer-events-none"
          )}
          aria-disabled={disabled}
        >
          {icon && <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">{icon}</span>}
          {label}
          {badge && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-mono bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
              {badge}
            </span>
          )}
        </a>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-base font-medium transition-colors text-left",
          "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-disabled={disabled}
      >
        {icon && <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">{icon}</span>}
        {label}
        {badge && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-mono bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
            {badge}
          </span>
        )}
      </button>
    </li>
  );
}

/**
 * Bottom Navigation - for mobile app-style navigation
 */
export interface BottomNavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  activeIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
  showLabels?: boolean;
}

export function BottomNavigation({
  items,
  activeIndex = 0,
  onChange,
  className,
  showLabels = true,
}: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-sticky md:hidden",
        "bg-surface border-t border-border-subtle shadow-xl",
        "safe-area-pb",
        className
      )}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          
          const handleClick = () => {
            if (!item.disabled) {
              onChange?.(index);
            }
          };

          if (item.href) {
            return (
              <Link
                key={index}
                href={item.href}
                onClick={handleClick}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  item.disabled && "opacity-50 pointer-events-none"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={item.disabled}
              >
                <span className="relative flex h-6 w-6 items-center justify-center" aria-hidden="true">
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-mono bg-error-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
                {showLabels && <span className="text-xs font-medium truncate max-w-[60px]">{item.label}</span>}
              </Link>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={handleClick}
              disabled={item.disabled}
              className={cn(
                "flex flex-col items-center gap-1.5 w-full px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={item.disabled}
            >
              <span className="relative flex h-6 w-6 items-center justify-center" aria-hidden="true">
                {isActive && item.activeIcon ? item.activeIcon : item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-mono bg-error-500 text-white">
                    {item.badge}
                  </span>
                )}
              </span>
              {showLabels && <span className="text-xs font-medium truncate max-w-[60px]">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose };
// All prop types above are already exported inline.