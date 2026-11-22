import type { Metadata } from "next";
import Link from "next/link";
import * as React from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { VerifyEmailView } from "./view";

export const metadata: Metadata = {
  title: "Verify your email | CALLBACX MARKETING",
  description: "Confirm your email address to activate your CALLBACX MARKETING account.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-16">
        <React.Suspense
          fallback={
            <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-surface p-8 text-center shadow-lg">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
              <p className="text-sm text-text-secondary">Loading…</p>
            </div>
          }
        >
          <VerifyEmailView />
        </React.Suspense>
        <noscript>
          <p className="mt-6 text-center text-sm text-text-secondary">
            Please enable JavaScript to verify your email, or{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              return to sign in
            </Link>
            .
          </p>
        </noscript>
      </main>
      <SiteFooter />
    </div>
  );
}