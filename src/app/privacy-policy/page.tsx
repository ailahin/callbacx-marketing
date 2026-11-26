import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CALLBACX MARKETING",
  description: "CALLBACX MARKETING privacy policy — how we collect, use, and protect your information.",
  openGraph: {
    title: "Privacy Policy | CALLBACX MARKETING",
    description: "CALLBACX MARKETING privacy policy — how we collect, use, and protect your information.",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
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
          title="Privacy Policy"
          description="Illustrative placeholder privacy policy. This document should be reviewed by legal counsel before publication."
          imagePosition="none"
        />

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="rounded-lg border border-border-subtle bg-neutral-50 dark:bg-neutral-800/50 p-4 mb-10 dark:border-neutral-800">
            <p className="text-sm font-medium text-text-primary">
              <span className="text-brand-600 dark:text-brand-400 font-semibold">Placeholder notice:</span>{" "}
              This privacy policy is illustrative placeholder content for demonstration purposes. It does not
              represent real data practices and must be replaced with a policy drafted for CALLBACX MARKETING's actual
              operations and reviewed by qualified legal counsel.
            </p>
          </div>

          <article className="text-text-secondary leading-relaxed space-y-8">
            <SectionTitle title="1. Introduction" textAlign="left" />
            <p>
              CALLBACX MARKETING ("we", "us", "our") is an influencer marketing agency committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you
              contact us or engage our agency services.
            </p>

            <SectionTitle title="2. No accounts" textAlign="left" />
            <p>
              CALLBACX MARKETING does not offer user accounts, registration, or login. Brands and influencers engage us
              by email or contact form, and we do not create personal profiles or dashboards for either side.
            </p>

            <SectionTitle title="3. Information we collect" textAlign="left" />
            <p>
              We may collect information you provide directly, such as your name, email address, organization, and role
              when you contact us or engage our services. We may also collect automatically collected information such
              as IP address, browser type, and usage data through cookies and similar technologies.
            </p>

            <SectionTitle title="4. How we use your information" textAlign="left" />
            <p>
              We use collected information to respond to your inquiries, run and manage campaigns, send updates (where
              you have opted in), and prevent fraud or abuse. We do not sell your personal information.
            </p>

            <SectionTitle title="5. Data minimization" textAlign="left" />
            <p>
              We collect only the information necessary to run your campaign. Because there are no accounts or dashboards,
              we store minimal personal data and delete it when it is no longer needed for the purpose it was collected.
            </p>

            <SectionTitle title="6. Sharing and disclosure" textAlign="left" />
            <p>
              We do not sell your personal information. We may share information with service providers that help us
              operate our website and with your consent in other circumstances, as required by law.
            </p>

            <SectionTitle title="7. Cookies and tracking" textAlign="left" />
            <p>
              Our website uses cookies and similar technologies to remember your preferences, analyze traffic, and
              improve functionality. You can manage cookie preferences through your browser settings.
            </p>

            <SectionTitle title="8. Your rights" textAlign="left" />
            <p>
              Depending on your location, you may have the right to access, correct, delete, or export your personal
              information, and to withdraw consent where applicable. To exercise these rights, contact us using the
              details below.
            </p>

            <SectionTitle title="9. Data security" textAlign="left" />
            <p>
              We implement reasonable technical and organizational measures to protect your information. However, no
              method of transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>

            <SectionTitle title="10. Links to other sites" textAlign="left" />
            <p>
              Our website may contain links to third-party websites. This policy does not apply to those sites, and we
              encourage you to read their privacy policies.
            </p>

            <SectionTitle title="11. Changes to this policy" textAlign="left" />
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
              effective date.
            </p>

            <SectionTitle title="12. Contact us" textAlign="left" />
            <p>
              Questions about this Privacy Policy can be directed to{" "}
              <Link href="mailto:privacy@callbacxmarketing.com" className="text-brand-600 dark:text-brand-400 hover:underline">
                privacy@callbacxmarketing.com
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
