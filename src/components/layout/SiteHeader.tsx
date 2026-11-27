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
 *
 * Improvements:
 * - Brand mark/logo on the left for brand recall
 * - Larger, more readable navigation text (text-base)
 * - Clear active state: brand color + underline + pill background + dot indicator
 * - Prominent primary CTA button (size lg, pill-shaped, brand shadow)
 * - Sticky blur background on scroll
 * - Larger touch targets on mobile with active indicator
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
    <header className="w-full transition-all duration-300 z-sticky" role="banner">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Brand / Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5"
            aria-label="CALLBACX home"
          >
            <span className="font-bold text-xl tracking-tight text-text-primary">
              CALLBACX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex md:items-center md:gap-8 flex-1 justify-center"
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
                    "relative px-2.5 py-1.5 text-base font-medium transition-colors duration-200",
                    isActive
                      ? "text-brand-700 dark:text-brand-300 decoration-brand-600 dark:decoration-brand-400 underline underline-offset-4"
                      : "text-text-secondary hover:text-brand-700 dark:hover:text-brand-400",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg",
                    isActive && "bg-brand-50/60 dark:bg-brand-950/30 px-2 py-1 rounded-md"
                  )}
                >
                  <span className={cn(isActive ? "font-semibold" : "font-medium")}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-brand-600 dark:bg-brand-400"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center flex-shrink-0 gap-2">
            <Button asChild size="lg" variant="primary" className="px-7 rounded-full shadow-lg hover:shadow-xl">
              <Link href={headerCTA.href}>{headerCTA.label}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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

      {/* Mobile Backdrop - tap outside to close */}
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
          className="fixed left-0 right-0 top-20 z-[230] max-h-[calc(100vh-5rem)] overflow-y-auto bg-surface border-b border-border-subtle shadow-2xl animate-slide-in-top md:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-2 py-6 px-6">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-base font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "text-brand-700 dark:text-brand-300 bg-brand-50/50 dark:bg-brand-950/20"
                      : "text-text-primary hover:text-brand-600 hover:bg-neutral-100 dark:hover:text-brand-400 dark:hover:bg-neutral-800",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  )}
                >
                  <span className={cn(isActive ? "font-semibold" : "font-medium")}>
                    {item.label}
                  </span>
                  {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400" />}
                </Link>
              );
            })}
            <div className="mt-5 px-4 border-t border-border-subtle pt-4">
              <Button asChild className="w-full" size="lg" variant="primary" className="rounded-full shadow-lg">
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
