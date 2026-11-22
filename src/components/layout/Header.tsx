"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/Button";

/**
 * Navigation Types
 */
export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  children?: NavItem[];
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Header Props
 */
export interface HeaderProps {
  /**
   * Logo/brand component
   */
  logo?: React.ReactNode;
  /**
   * Logo href
   */
  logoHref?: string;
  /**
   * Primary navigation items
   */
  navigation?: NavItem[];
  /**
   * Secondary navigation (right side)
   */
  actions?: NavItem[];
  /**
   * Header variant
   */
  variant?: "default" | "transparent" | "bordered" | "elevated";
  /**
   * Fixed position
   */
  fixed?: boolean;
  /**
   * Show mobile menu button
   */
  mobileMenuButton?: boolean;
  /**
   * Callback for mobile menu toggle
   */
  onMobileMenuToggle?: () => void;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Container max width
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Default Header Component
 */
export function Header({
  logo,
  logoHref = "/",
  navigation = [],
  actions = [],
  variant = "default",
  fixed = false,
  mobileMenuButton = true,
  onMobileMenuToggle,
  className,
  maxWidth = "xl",
}: HeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerMaxWidths = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[80rem]",
    full: "max-w-full",
  };

  const variantStyles = {
    default: "bg-surface/80 backdrop-blur-md border-b border-border-subtle",
    transparent: "bg-transparent",
    bordered: "bg-surface border-b border-border-default",
    elevated: "bg-surface shadow-sm",
  };

  const fixedStyles = fixed
    ? "fixed top-0 left-0 right-0 z-sticky transition-all duration-200"
    : "relative";

  const scrolledStyles = scrolled && variant === "transparent"
    ? "bg-surface/95 backdrop-blur-md border-b border-border-subtle shadow-sm"
    : "";

  return (
    <header
      className={cn(
        "w-full transition-all duration-200",
        fixedStyles,
        variantStyles[variant],
        scrolledStyles,
        className
      )}
      role="banner"
    >
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          containerMaxWidths[maxWidth]
        )}
      >
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex md:items-center md:gap-1 flex-1 justify-center"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigation.map((item, index) => (
              <NavItemComponent key={index} item={item} />
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:gap-2 flex-shrink-0">
            {actions.map((item, index) => (
              <NavItemComponent key={index} item={item} variant="action" />
            ))}
          </div>

          {/* Mobile Menu Button */}
          {mobileMenuButton && (
            <button
              type="button"
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                onMobileMenuToggle?.();
              }}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden py-4 border-t border-border-subtle animate-slide-in-top"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-2">
              {navigation.map((item, index) => (
                <MobileNavItem key={index} item={item} />
              ))}
              {actions.length > 0 && (
                <>
                  <div className="h-px bg-border-subtle my-2" role="separator" />
                  {actions.map((item, index) => (
                    <MobileNavItem key={index} item={item} variant="action" />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * NavItem Component for desktop
 */
function NavItemComponent({ item, variant = "nav" }: { item: NavItem; variant?: "nav" | "action" }) {
  const { label, href, onClick, children, icon, badge, disabled, external } = item;

  if (children && children.length > 0) {
    return (
      <DropdownNavItem item={item} variant={variant} />
    );
  }

  const baseStyles = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";
  
  const navStyles = variant === "nav"
    ? "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
    : "text-text-primary hover:text-brand-600 dark:hover:text-brand-400";

  const actionStyles = variant === "action"
    ? "text-text-primary hover:text-brand-600 dark:hover:text-brand-400"
    : "";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseStyles, navStyles, actionStyles, disabled && "opacity-50 pointer-events-none")}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-disabled={disabled}
      >
        {icon && <span className="h-4 w-4" aria-hidden="true">{icon}</span>}
        {label}
        {badge && <Badge count={badge} size="xs" variant="primary" />}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, navStyles, actionStyles, disabled && "opacity-50 cursor-not-allowed")}
      aria-disabled={disabled}
    >
      {icon && <span className="h-4 w-4" aria-hidden="true">{icon}</span>}
      {label}
      {badge && <Badge count={badge} size="xs" variant="primary" />}
    </button>
  );
}

/**
 * Dropdown Navigation Item
 */
function DropdownNavItem({ item, variant }: { item: NavItem; variant?: "nav" | "action" }) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { label, children, icon, disabled } = item;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
          variant === "nav"
            ? "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
            : "text-text-primary hover:text-brand-600 dark:hover:text-brand-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-disabled={disabled}
      >
        {icon && <span className="h-4 w-4" aria-hidden="true">{icon}</span>}
        {label}
        <svg
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-surface border border-border-default shadow-lg p-1 animate-scale-in"
          role="menu"
        >
          {children?.map((child, index) => (
            <NavDropdownItem key={index} item={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavDropdownItem({ item }: { item: NavItem }) {
  const { label, href, onClick, icon, disabled } = item;

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium",
          "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          disabled && "opacity-50 pointer-events-none"
        )}
        aria-disabled={disabled}
        role="menuitem"
      >
        {icon && <span className="h-4 w-4 flex-shrink-0" aria-hidden="true">{icon}</span>}
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-left",
        "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-disabled={disabled}
      role="menuitem"
    >
      {icon && <span className="h-4 w-4 flex-shrink-0" aria-hidden="true">{icon}</span>}
      {label}
    </button>
  );
}

/**
 * Mobile Nav Item
 */
function MobileNavItem({ item, variant = "nav" }: { item: NavItem; variant?: "nav" | "action" }) {
  const { label, href, onClick, children, icon, disabled } = item;

  if (children && children.length > 0) {
    return (
      <MobileDropdownNavItem item={item} variant={variant} />
    );
  }

  const baseStyles = "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium transition-colors";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          baseStyles,
          variant === "nav"
            ? "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
            : "text-text-primary hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50",
          disabled && "opacity-50 pointer-events-none"
        )}
        aria-disabled={disabled}
      >
        {icon && <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">{icon}</span>}
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variant === "nav"
          ? "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
          : "text-text-primary hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-disabled={disabled}
    >
      {icon && <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">{icon}</span>}
      {label}
    </button>
  );
}

function MobileDropdownNavItem({ item, variant }: { item: NavItem; variant?: "nav" | "action" }) {
  const [open, setOpen] = React.useState(false);
  const { label, children, icon } = item;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg text-base font-medium transition-colors",
          variant === "nav"
            ? "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
            : "text-text-primary hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50"
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          {icon && <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">{icon}</span>}
          {label}
        </span>
        <svg
          className={cn("h-5 w-5 flex-shrink-0 text-text-tertiary transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-1 ml-8 border-l-2 border-border-subtle pl-3 space-y-1 animate-slide-in-top">
          {children?.map((child, index) => (
            <MobileNavItem key={index} item={child} variant={variant} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Badge component for navigation (inline to avoid circular deps)
 */
function Badge({ count, size = "xs", variant = "primary" }: { count: string | number; size?: "xs" | "sm" | "md"; variant?: string }) {
  const displayCount = typeof count === "number" && count > 99 ? "99+" : count;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-mono tabular-nums rounded-full",
        "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300",
        size === "xs" && "h-4 min-w-4 px-1.5 text-[10px]",
        size === "sm" && "h-5 min-w-5 px-2 text-xs",
        size === "md" && "h-6 min-w-6 px-2.5 text-sm"
      )}
      aria-label={`${count} notifications`}
    >
      {displayCount}
    </span>
  );
}

export default Header;

