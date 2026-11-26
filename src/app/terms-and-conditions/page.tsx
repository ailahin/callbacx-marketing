import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms | CALLBACX MARKETING",
  description: "CALLBACX MARKETING terms and conditions governing use of the website and agency services.",
  openGraph: {
    title: "Terms | CALLBACX MARKETING",
    description: "CALLBACX MARKETING terms and conditions governing use of the website and agency services.",
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
          title="Terms"
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
              You must be at least 13 years old to contact CALLBACX MARKETING or engage our agency services. Campaign
              participation may be subject to additional eligibility requirements agreed in writing.
            </p>

            <SectionTitle title="3. No accounts" textAlign="left" />
            <p>
              CALLBACX MARKETING does not offer user accounts, registration, or login. Brands and influencers engage us by
              email or contact form, and all campaign coordination is managed by our team directly.
            </p>

            <SectionTitle title="4. Agency services" textAlign="left" />
            <p>
              CALLBACX MARKETING is an influencer marketing agency, not a marketplace. We find brands, find influencers,
              negotiate deals, and manage campaigns by email. We are not a party to contracts between brands and
              influencers unless expressly agreed in writing.
            </p>

            <SectionTitle title="5. Campaign agreements" textAlign="left" />
            <p>
              Rates, deliverables, usage rights, timelines, and compensation for each campaign are set out in a written
              campaign agreement between CALLBACX MARKETING and the client. We do not guarantee specific campaign results,
              reach, engagement, or conversions.
            </p>

            <SectionTitle title="6. Intellectual property" textAlign="left" />
            <p>
              The CALLBACX MARKETING website, brand, design system, and materials are owned by CALLBACX MARKETING or its
              licensors and are protected by copyright, trademark, and other laws.
            </p>

            <SectionTitle title="7. Your content" textAlign="left" />
            <p>
              You retain ownership of content you create. Usage rights granted to brands are set out in the applicable
              campaign agreement.
            </p>

            <SectionTitle title="8. Disclaimers" textAlign="left" />
            <p>
              The services are provided "as is" without warranties of any kind. We do not guarantee that any particular
              brand or influencer will be available, or that any campaign will achieve specific results.
            </p>

            <SectionTitle title="9. Limitation of liability" textAlign="left" />
            <p>
              To the extent permitted by law, CALLBACX MARKETING is not liable for indirect, incidental, or consequential
              damages arising from use of the website or services.
            </p>

            <SectionTitle title="10. Termination" textAlign="left" />
            <p>
              We may decline or cease engagement with any client or partner, with or without notice.
            </p>

            <SectionTitle title="11. Governing law" textAlign="left" />
            <p>
              These terms are governed by the laws of the jurisdiction applicable to CALLBACX MARKETING's operations,
              without regard to conflict-of-law principles.
            </p>

            <SectionTitle title="12. Contact us" textAlign="left" />
            <p>
              Questions about these terms can be directed to{" "}
              <Link href="mailto:legal@callbacxmarketing.com" className="text-brand-600 dark:text-brand-400 hover:underline">
                legal@callbacxmarketing.com
              </Link>{" "}
              — placeholder contact address.
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
