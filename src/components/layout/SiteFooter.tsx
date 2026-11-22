"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { footerColumns, legalLinks, socialLinks } from "./nav-config";

/**
 * CALLBACX MARKETING Site Footer
 * Product/company/legal columns, newsletter signup, social links,
 * copyright and legal links.
 */
export function SiteFooter() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [currentYear, setCurrentYear] = React.useState(0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentYear(new Date().getFullYear());
  }, []);

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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
      setMessage("Thanks for subscribing!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <footer className="w-full border-t border-border-subtle bg-surface" role="contentinfo">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main content */}
        <div className="grid gap-8 md:gap-12 lg:grid-cols-2 xl:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1 xl:col-span-1 space-y-5">
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Connecting brands, influencers, creators and audiences through meaningful partnerships.
            </p>
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
          </div>

          {/* Navigation columns */}
          {footerColumns.map((column, colIndex) => (
            <div key={colIndex} className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{column.title}</h3>
              <nav aria-label={column.title || `Footer navigation ${colIndex + 1}`}>
                <ul className="space-y-3" role="list">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={cn(
                          "text-sm text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none",
                          "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded"
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

          {/* Newsletter column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Stay Updated</h3>
              <p className="mt-1 text-sm text-text-secondary">Get the latest updates delivered to your inbox.</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2" noValidate>
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== "idle") setStatus("idle");
                }}
                placeholder="Enter your email"
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
              <Button type="submit" size="md" variant="primary" loading={status === "loading"} disabled={status === "success"} className="whitespace-nowrap">
                Subscribe
              </Button>
              {(status === "success" || status === "error") && (
                <p id="footer-email-message" className={cn("mt-2 text-xs", status === "success" ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400")} role="alert" aria-live="polite">
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-border-subtle" role="separator" />

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-text-tertiary">© {currentYear} CALLBACX MARKETING. All rights reserved.</p>
          <nav aria-label="Legal links" className="flex flex-wrap items-center gap-4 md:gap-6">
            {legalLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-sm text-text-tertiary hover:text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;


