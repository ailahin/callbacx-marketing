"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Footer Types
 */
export interface FooterLink {
  label: string;
  href: string;
  onClick?: () => void;
  external?: boolean;
}

export interface FooterColumn {
  title?: string;
  links: FooterLink[];
}

export interface FooterProps {
  /**
   * Logo/brand
   */
  logo?: React.ReactNode;
  /**
   * Company/product name
   */
  brandName?: string;
  /**
   * Tagline/description
   */
  tagline?: string;
  /**
   * Navigation columns
   */
  columns?: FooterColumn[];
  /**
   * Social links
   */
  socialLinks?: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
  }>;
  /**
   * Copyright text
   */
  copyright?: string;
  /**
   * Legal links
   */
  legalLinks?: FooterLink[];
  /**
   * Newsletter signup
   */
  newsletter?: {
    title: string;
    description?: string;
    placeholder?: string;
    buttonText?: string;
    onSubmit?: (email: string) => void;
  };
  /**
   * Footer variant
   */
  variant?: "default" | "minimal" | "extended";
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Default Footer Component
 */
export function Footer({
  logo,
  brandName = "CALLBACX MARKETING",
  tagline = "Influencer marketing campaigns, managed by our team — by email, not by dashboard.",
  columns = [],
  socialLinks = [],
  copyright,
  legalLinks = [],
  newsletter,
  variant = "default",
  className,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = copyright || `Â© ${currentYear} ${brandName}. All rights reserved.`;

  const variantStyles = {
    default: "bg-surface border-t border-border-subtle",
    minimal: "bg-transparent border-t border-border-subtle",
    extended: "bg-surface-subtle border-t border-border-subtle",
  };

  return (
    <footer
      className={cn(variantStyles[variant], "w-full", className)}
      role="contentinfo"
    >
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {variant !== "minimal" && (
          <>
            {/* Main Content */}
            <div className="grid gap-8 md:gap-12 lg:grid-cols-2 xl:grid-cols-4">
              {/* Brand Column */}
              <div className="lg:col-span-1 xl:col-span-1">
              <div className="space-y-4">
                {tagline && (
                    <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                      {tagline}
                    </p>
                  )}
                  {socialLinks.length > 0 && (
                    <div className="flex gap-3" role="list" aria-label="Social links">
                      {socialLinks.map((social, index) => (
                        <Link
                          key={index}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            "text-text-tertiary hover:text-text-primary",
                            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                            "transition-colors focus-visible:outline-none",
                            "focus-visible:ring-2 focus-visible:ring-brand-500"
                          )}
                          aria-label={social.label}
                        >
                          {social.icon}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Columns */}
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="space-y-4">
                  {column.title && (
                    <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                      {column.title}
                    </h3>
                  )}
                  <nav aria-label={column.title || `Footer navigation ${colIndex + 1}`}>
                    <ul className="space-y-3" role="list">
                      {column.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <Link
                            href={link.href}
                            onClick={link.onClick}
                            target={link.external ? "_blank" : undefined}
                            rel={link.external ? "noopener noreferrer" : undefined}
                            className={cn(
                              "text-sm text-text-secondary hover:text-text-primary",
                              "transition-colors focus-visible:outline-none",
                              "focus-visible:ring-2 focus-visible:ring-brand-500",
                              "focus-visible:ring-offset-2 rounded"
                            )}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              ))}

              {/* Newsletter Column */}
              {newsletter && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                      {newsletter.title}
                    </h3>
                    {newsletter.description && (
                      <p className="mt-1 text-sm text-text-secondary">
                        {newsletter.description}
                      </p>
                    )}
                  </div>
                  <NewsletterForm
                    placeholder={newsletter.placeholder || "Enter your email"}
                    buttonText={newsletter.buttonText || "Subscribe"}
                    onSubmit={newsletter.onSubmit}
                  />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mt-12 border-t border-border-subtle" role="separator" />
          </>
        )}

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-text-tertiary">{defaultCopyright}</p>

          {legalLinks.length > 0 && (
            <nav aria-label="Legal links" className="flex flex-wrap items-center gap-4 md:gap-6">
              {legalLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  onClick={link.onClick}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={cn(
                    "text-sm text-text-tertiary hover:text-text-secondary",
                    "transition-colors focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-brand-500",
                    "focus-visible:ring-offset-2 rounded"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}

/**
 * Newsletter Form Component
 */
function NewsletterForm({
  placeholder,
  buttonText,
  onSubmit,
}: {
  placeholder: string;
  buttonText: string;
  onSubmit?: (email: string) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      if (onSubmit) {
        await onSubmit(email);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setStatus("success");
      setMessage("Thanks for subscribing!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status !== "idle") setStatus("idle");
        }}
        placeholder={placeholder}
        disabled={status === "loading" || status === "success"}
        className={cn(
          "flex-1 h-10 px-4 text-sm rounded-lg border bg-surface",
          "placeholder:text-text-tertiary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          status === "error" && "border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/20",
          status === "success" && "border-success-500 focus-visible:border-success-500 focus-visible:ring-success-500/20",
          "dark:border-neutral-700 dark:focus-visible:ring-offset-neutral-900"
        )}
        aria-describedby={status !== "idle" ? "footer-email-message" : undefined}
      />
      <Button
        type="submit"
        size="md"
        variant="primary"
        loading={status === "loading"}
        disabled={status === "success"}
        className="whitespace-nowrap"
      >
        {buttonText}
      </Button>
      {(status === "success" || status === "error") && (
        <p
          id="footer-email-message"
          className={cn(
            "absolute -top-6 left-0 text-xs",
            status === "success" ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"
          )}
          role="alert"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </form>
  );
}

/**
 * Minimal Footer - for simple pages
 */
export interface MinimalFooterProps {
  copyright?: string;
  legalLinks?: FooterLink[];
  className?: string;
}

export function MinimalFooter({ copyright, legalLinks = [], className }: MinimalFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "w-full border-t border-border-subtle py-6",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-text-tertiary text-center md:text-left">
            {copyright || `© ${currentYear} CALLBACX MARKETING. All rights reserved.`}
          </p>
          {legalLinks.length > 0 && (
            <nav aria-label="Legal links" className="flex flex-wrap items-center justify-center md:justify-end gap-4">
              {legalLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  onClick={link.onClick}
                  className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;

