import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "./form";

export const metadata: Metadata = {
  title: "Reset your password | CALLBACX MARKETING",
  description: "Request a password reset link to regain access to your CALLBACX MARKETING account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <AuthShell
          title="Forgot your password?"
          description="Enter the email tied to your account and we will send you a secure link to reset it."
        >
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm text-text-secondary">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Back to sign in
            </Link>
          </p>
        </AuthShell>
      </main>
      <SiteFooter />
    </div>
  );
}