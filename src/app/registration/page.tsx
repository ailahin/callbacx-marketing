import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegistrationForm } from "./form";

export const metadata: Metadata = {
  title: "Join CALLBACX MARKETING | Creator & Brand Registration",
  description: "Register as a brand or creator on CALLBACX MARKETING.",
  openGraph: {
    title: "Join CALLBACX MARKETING | CALLBACX MARKETING",
    description: "Register as a brand or creator on CALLBACX MARKETING.",
    type: "website",
  },
};

export default function RegistrationPage() {
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
          eyebrow="Join CALLBACX MARKETING"
          title="Create your account"
          description="Start building meaningful partnerships as a brand or creator."
        >
          <RegistrationForm />
          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Sign in
            </Link>
          </p>
        </AuthShell>
      </main>
      <SiteFooter />
    </div>
  );
}