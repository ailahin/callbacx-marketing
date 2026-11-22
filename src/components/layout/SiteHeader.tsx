"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * CALLBACX MARKETING Site Header
 * Sticky, responsive header with desktop navigation, action links,
 * a primary CTA button, and a mobile sheet menu.
 */
export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      // scroll state handled via CSS if needed in future
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full transition-all duration-200 z-sticky" role="banner">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-1 flex-1 justify-center" role="navigation" aria-label="Main navigation">
{[
              { label: "Home", href: "/" },
              { label: "About CALLBACX MARKETING", href: "/about" },
              { label: "For Brands", href: "/for-brands" },
              { label: "For Creators", href: "/for-creators" },
              { label: "Services", href: "/services" },
              { label: "How It Works", href: "/how-it-works" },
              { label: "Contact", href: "/contact" },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:text-text-primary dark:hover:bg-neutral-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 text-text-primary hover:text-brand-600 dark:hover:text-brand-400"
            >
              Login
            </Link>
            <Link
              href="/registration"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/50 border border-transparent hover:border-brand-200 dark:hover:border-brand-800"
            >
              Join as Creator
            </Link>
            <Button asChild size="md">
              <Link href="/contact">Start a Campaign</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-border-subtle animate-slide-in-top" role="navigation" aria-label="Mobile navigation">
            <div className="flex flex-col gap-2">
{[
                { label: "Home", href: "/" },
                { label: "About CALLBACX MARKETING", href: "/about" },
                { label: "For Brands", href: "/for-brands" },
                { label: "For Creators", href: "/for-creators" },
                { label: "Services", href: "/services" },
                { label: "How It Works", href: "/how-it-works" },
                { label: "Contact", href: "/contact" },
              ].map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium transition-colors text-text-primary hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-3 flex gap-2 px-4">
                <Link
                  href="/login"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/50 border border-transparent hover:border-brand-200 dark:hover:border-brand-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/registration"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-text-primary hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Join as Creator
                </Link>
              </div>
              <div className="px-4">
                <Button asChild className="w-full" size="lg">
                  <Link href="/contact">Start a Campaign</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default SiteHeader;


