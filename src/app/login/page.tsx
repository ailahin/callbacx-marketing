import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { LoginForm } from "./form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | CALLBACX MARKETING",
  description: "Sign in to your CALLBACX MARKETING account.",
  openGraph: {
    title: "Login | CALLBACX MARKETING",
    description: "Sign in to your CALLBACX MARKETING account.",
    type: "website",
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
<PageHero
          title="Welcome back"
          description="Sign in to your CALLBACX MARKETING account to manage campaigns and partnerships."
          imagePosition="none"
        />

        <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <div className="space-y-6 max-w-lg">
              <SectionTitle title="Sign in" textAlign="left" />
              <p className="text-text-secondary">
                Do not have an account?{" "}
                <Link href="/registration" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
                  Join as a creator
                </Link>
              </p>
            </div>

            <div className="max-w-lg"><LoginForm /></div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


