import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = {
  title: "Set a new password | CALLBACX MARKETING",
  description: "Choose a new password for your CALLBACX MARKETING account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
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
          title="Set a new password"
          description="Choose a strong password you do not use on other sites."
        >
          <ResetPasswordForm />
          <p className="mt-6 text-center text-sm text-text-secondary">
            Changed your mind?{" "}
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