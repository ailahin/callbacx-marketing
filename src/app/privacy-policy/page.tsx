import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CALLBACX TECHNOLOGY",
  description: "CALLBACX TECHNOLOGY privacy policy â€” how we collect, use, and protect your information.",
  openGraph: {
    title: "Privacy Policy | CALLBACX TECHNOLOGY",
    description: "CALLBACX TECHNOLOGY privacy policy â€” how we collect, use, and protect your information.",
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
              represent real data practices and must be replaced with a policy drafted for CALLBACX TECHNOLOGY&apos;s actual
              operations and reviewed by qualified legal counsel.
            </p>
          </div>

          <article className="text-text-secondary leading-relaxed space-y-8">
            <SectionTitle title="1. Introduction" textAlign="left" />
            <p>
              CALLBACX TECHNOLOGY (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how
              we collect, use, disclose, and safeguard information when you use our website and services.
            </p>

            <SectionTitle title="2. Information we collect" textAlign="left" />
            <p>
              We may collect information you provide directly, such as your name, email address, organization,
              and role when you register, subscribe to our newsletter, or contact us. We may also collect
              automatically collected information such as IP address, browser type, and usage data through cookies
              and similar technologies.
            </p>

            <SectionTitle title="3. How we use your information" textAlign="left" />
            <p>
              We use collected information to operate and improve our services, respond to your inquiries,
              personalize your experience, send updates (where you have opted in), and prevent fraud or abuse.
            </p>

            <SectionTitle title="4. Sharing and disclosure" textAlign="left" />
            <p>
              We do not sell your personal information. We may share information with service providers that help
              us operate our website and with your consent in other circumstances, as required by law.
            </p>

            <SectionTitle title="5. Cookies and tracking" textAlign="left" />
            <p>
              Our website uses cookies and similar technologies to remember your preferences, analyze traffic, and
              improve functionality. You can manage cookie preferences through your browser settings.
            </p>

            <SectionTitle title="6. Your rights" textAlign="left" />
            <p>
              Depending on your location, you may have the right to access, correct, delete, or export your
              personal information, and to withdraw consent where applicable. To exercise these rights, contact us
              using the details below.
            </p>

            <SectionTitle title="7. Data security" textAlign="left" />
            <p>
              We implement reasonable technical and organizational measures to protect your information. However,
              no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>

            <SectionTitle title="8. Links to other sites" textAlign="left" />
            <p>
              Our website may contain links to third-party websites. This policy does not apply to those sites,
              and we encourage you to read their privacy policies.
            </p>

            <SectionTitle title="9. Changes to this policy" textAlign="left" />
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated effective date.
            </p>

            <SectionTitle title="10. Contact us" textAlign="left" />
            <p>
              Questions about this Privacy Policy can be directed to <Link href="mailto:privacy@callbacxtechnology.com" className="text-brand-600 dark:text-brand-400 hover:underline">privacy@callbacxtechnology.com</Link> â€” placeholder contact address.
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


