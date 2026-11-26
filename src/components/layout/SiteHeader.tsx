"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { mainNavigation, headerCTA } from "./nav-config";

/**
 * CALLBACX MARKETING Site Header
 * Sticky, responsive header with desktop navigation, a primary CTA button,
 * and a mobile sheet menu. No auth links: CALLBACX MARKETING is an agency
 * contacted by email, not a marketplace with member accounts.
 */

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleKeydown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const openMobileMenu = () => setMobileMenuOpen(true);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="w-full transition-all duration-200 z-sticky" role="banner">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Desktop Navigation - items spread equally across the bar */}
          <nav
            className="hidden md:flex md:items-center md:justify-between flex-1"
            role="navigation"
            aria-label="Main navigation"
          >
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-200",
                    isActive
                      ? "text-brand-700 dark:text-brand-400 bg-brand-50/40 dark:bg-brand-950/20 decoration-brand-600 dark:decoration-brand-400 underline underline-offset-2"
                      : "text-text-secondary hover:text-brand-700 dark:hover:text-brand-400 hover:bg-brand-50/60 dark:hover:bg-brand-950/40",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center flex-shrink-0">
            <Button asChild size="md">
              <Link href={headerCTA.href}>{headerCTA.label}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            onClick={openMobileMenu}
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
        </div>
      </div>

      {/* Mobile Menu Backdrop - tap outside to close */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[210] bg-black/30 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Dropdown Panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed left-0 right-0 top-16 z-[230] max-h-[calc(100vh-4rem)] overflow-y-auto bg-surface border-b border-border-subtle shadow-2xl animate-slide-in-top md:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-2 py-4">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "text-brand-700 dark:text-brand-400 bg-brand-50/40 dark:bg-brand-950/20"
                      : "text-text-primary hover:text-brand-600 hover:bg-brand-50 dark:hover:text-brand-400 dark:hover:bg-brand-950/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="px-4">
              <Button asChild className="w-full" size="lg">
                <Link href={headerCTA.href} onClick={closeMobileMenu}>
                  {headerCTA.label}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;
