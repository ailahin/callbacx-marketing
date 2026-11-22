import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | CALLBACX MARKETING",
  description: "CALLBACX MARKETING terms and conditions governing use of the website and services.",
  openGraph: {
    title: "Terms and Conditions | CALLBACX MARKETING",
    description: "CALLBACX MARKETING terms and conditions governing use of the website and services.",
    type: "website",
  },
};

export default function TermsPage() {
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
          title="Terms and Conditions"
          description="Illustrative placeholder terms and conditions. This document should be reviewed by legal counsel before publication."
          imagePosition="none"
        />

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
<div className="rounded-lg border border-border-subtle bg-neutral-50 dark:bg-neutral-800/50 p-4 mb-10 dark:border-neutral-800">
            <p className="text-sm font-medium text-text-primary">
              <span className="text-brand-600 dark:text-brand-400 font-semibold">Placeholder notice:</span>{" "}
              These terms and conditions are illustrative placeholder content for demonstration purposes. They do
              not represent real legal terms and must be replaced with terms drafted for CALLBACX MARKETING's actual
              operations and reviewed by qualified legal counsel.
            </p>
          </div>

          <article className="text-text-secondary leading-relaxed space-y-8">
            <SectionTitle title="1. Acceptance of terms" textAlign="left" />
<p>
              By accessing or using the CALLBACX MARKETING website and services, you accept these terms and conditions. If you
              do not agree, you may not use our services.
            </p>

            <SectionTitle title="2. Eligibility" textAlign="left" />
<p>
              You must be at least 13 years old to use CALLBACX MARKETING. Campaign participation for brands and creators may
              be subject to additional eligibility requirements.
            </p>

            <SectionTitle title="3. Accounts" textAlign="left" />
            <p>
              When you create an account, you agree to provide accurate information and keep your credentials
              secure. You are responsible for all activity under your account.
            </p>

            <SectionTitle title="4. Services" textAlign="left" />
<p>
              CALLBACX MARKETING provides a platform connecting brands and creators for influencer marketing campaigns. We
              facilitate discovery, matching, contracts, content approval, and reporting. We are not a party to
              contracts between brands and creators unless expressly agreed.
            </p>

            <SectionTitle title="5. User content" textAlign="left" />
<p>
              You retain ownership of content you create. By publishing content through CALLBACX MARKETING, you grant the
              relevant brand the usage rights specified in your campaign agreement.
            </p>

            <SectionTitle title="6. Intellectual property" textAlign="left" />
<p>
              The CALLBACX MARKETING website, brand, design system, and platform are owned by CALLBACX MARKETING or its licensors and are
              protected by copyright, trademark, and other laws.
            </p>

            <SectionTitle title="7. Disclaimers" textAlign="left" />
<p>
              The services are provided "as is" without warranties of any kind. CALLBACX MARKETING does not guarantee specific
              campaign results, reach, engagement, or conversions.
            </p>

            <SectionTitle title="8. Limitation of liability" textAlign="left" />
<p>
              To the extent permitted by law, CALLBACX MARKETING is not liable for indirect, incidental, or consequential
              damages arising from use of the services.
            </p>

            <SectionTitle title="9. Termination" textAlign="left" />
            <p>
              We may suspend or terminate accounts that violate these terms, with or without notice.
            </p>

            <SectionTitle title="10. Governing law" textAlign="left" />
<p>
              These terms are governed by the laws of the jurisdiction applicable to CALLBACX MARKETING's operations, without
              regard to conflict-of-law principles.
            </p>

            <SectionTitle title="11. Contact us" textAlign="left" />
<p>
              Questions about these terms can be directed to <Link href="mailto:legal@callbacxmarketing.com" className="text-brand-600 dark:text-brand-400 hover:underline">legal@callbacxmarketing.com</Link> — placeholder contact address.
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


