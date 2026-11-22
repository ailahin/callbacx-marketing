import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./form";

export const metadata: Metadata = {
  title: "Login | CALLBACX MARKETING",
  description: "Sign in to your CALLBACX MARKETING account.",
  openGraph: {
    title: "Login | CALLBACX MARKETING",
    description: "Sign in to your CALLBACX MARKETING account.",
    type: "website",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirect = (resolvedSearchParams.redirect as string) || "/dashboard";
  const justRegistered = resolvedSearchParams.registered === "1";
  const justReset = resolvedSearchParams.reset === "1";

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
          eyebrow="Welcome back"
          title="Sign in to your account"
          description="Manage campaigns, partnerships, and collaborations in one place."
        >
          {justRegistered && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-success-200 bg-success-50 p-3 text-sm text-success-700 animate-scale-in dark:border-success-800 dark:bg-success-950/40 dark:text-success-300"
            >
              Account created. Check your email to verify, then sign in.
            </div>
          )}
          {justReset && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-success-200 bg-success-50 p-3 text-sm text-success-700 animate-scale-in dark:border-success-800 dark:bg-success-950/40 dark:text-success-300"
            >
              Password updated. Sign in with your new password.
            </div>
          )}
          <LoginForm redirect={redirect} />
          <p className="mt-6 text-center text-sm text-text-secondary">
            New to CALLBACX MARKETING?{" "}
            <Link href="/registration" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Create an account
            </Link>
          </p>
        </AuthShell>
      </main>
      <SiteFooter />
    </div>
  );
}