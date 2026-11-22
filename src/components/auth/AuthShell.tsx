"use client";

import * as React from "react";

/**
 * AuthShell — a responsive, visually rich wrapper for authentication pages.
 *
 * Renders a two-column layout on large screens (brand panel + form card) and a
 * single, focused column on mobile. Decorative, animated background elements
 * respect reduced-motion preferences via the global stylesheet.
 */
export interface AuthShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Optional eyebrow/label shown above the title. */
  eyebrow?: string;
  /** Footer content rendered under the form (e.g. switch links). */
  footer?: React.ReactNode;
}

export function AuthShell({ title, description, children, eyebrow, footer }: AuthShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-[80rem] flex-col items-stretch gap-10 px-4 py-12 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-20">
      {/* Brand / marketing panel — hidden on small screens to keep focus on the form */}
      <aside className="relative hidden lg:block" aria-hidden="true">
        <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-10 text-white shadow-brand">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl" />
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-accent-300" />
              CALLBACX MARKETING
            </div>
            <h2 className="text-display-sm font-bold leading-tight tracking-tight">
              Where brands and creators build meaningful partnerships.
            </h2>
            <p className="mt-4 max-w-md text-brand-100">
              Launch campaigns, discover the right creators, and manage every collaboration in one place.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-brand-50">
              {[
                "Secure, role-based access for brands and creators",
                "Campaign and collaboration management",
                "Transparent payments and analytics",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Form column */}
      <section className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-lg sm:p-8">
          <div className="mb-6 space-y-2">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {eyebrow}
              </p>
            )}
            <h1 className="text-h3 font-bold tracking-tight text-text-primary">{title}</h1>
            {description && <p className="text-sm leading-relaxed text-text-secondary">{description}</p>}
          </div>
          {children}
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </section>
    </div>
  );
}