import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SparklesIcon, MailIcon, GlobeIcon, TargetIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "About Us | CALLBACX MARKETING",
  description: "CALLBACX MARKETING is an influencer marketing agency. Our team finds brands, finds influencers, negotiates deals, and manages campaigns by email.",
  openGraph: {
    title: "About Us | CALLBACX MARKETING",
    description: "CALLBACX MARKETING is an influencer marketing agency. Our team finds brands, finds influencers, negotiates deals, and manages campaigns by email.",
    type: "website",
  },
};

export default function AboutPage() {
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
          title="About Us"
          description="An influencer marketing agency that manages campaigns by email — no marketplace, no dashboards, no logins."
          imagePosition="none"
          cta={{ label: "Start a Campaign", href: "/contact" }}
        />

        <Section padding="xl" id="story">
          <SectionTitle
            id="story-heading"
            title="Our story"
            description="Woven with intention."
            textAlign="center"
          />
          <div className="mt-12 lg:mt-16 prose-lg text-text-secondary leading-relaxed max-w-3xl mx-auto space-y-6">
            <p>
              CALLBACX MARKETING was built to make influencer marketing simpler, more transparent, and more human.
              Too often, brand-influencer partnerships are complicated by mismatched expectations, unclear rights,
              and opaque platforms that pit both sides against each other.
            </p>
            <p>
              We are an agency, not a marketplace. Our team finds brands, finds influencers, negotiates deals, and
              manages campaigns by email. Brands and influencers do not have dashboards, do not log in, and do not
              discover each other on this website — they contact us, and we manage everything.
            </p>
            <p>
              Every campaign is handled end to end: briefs, negotiation, contracts, content approval, scheduling,
              and reporting. One point of contact, one accountable team.
            </p>
          </div>
        </Section>

        <Section padding="xl" bg="subtle" id="approach">
          <SectionTitle
            id="approach-heading"
            title="Our approach"
            textAlign="center"
          />
          <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-4">
            <AgencyValue
              icon={<SparklesIcon />}
              title="Agency, not marketplace"
              description="We do the work of finding, negotiating, and managing — neither brands nor influencers need accounts or dashboards."
            />
            <AgencyValue
              icon={<MailIcon />}
              title="Managed by email"
              description="Campaigns run through direct email coordination, so there is always a person responsible for your campaign."
            />
            <AgencyValue
              icon={<GlobeIcon />}
              title="Transparent by default"
              description="Clear rates, clear contracts, clear reporting — no hidden fees, no opaque algorithms deciding who gets seen."
            />
            <AgencyValue
              icon={<TargetIcon />}
              title="Outcomes first"
              description="Campaigns are built around goals, audience fit, and measurable results, not follower counts alone."
            />
          </div>
        </Section>

        <Section padding="lg" id="cta">
          <div className="rounded-3xl bg-surface border border-border-subtle p-10 lg:p-16 text-center shadow-sm dark:border-neutral-800">
            <h2 className="text-h2 font-bold mb-4 text-text-primary">Ready to work with CALLBACX MARKETING?</h2>
            <p className="text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
              Whether you are a brand launching your first campaign or an influencer looking for the right
              partnerships, we would love to hear from you.
            </p>
            <Button asChild size="lg" variant="primary">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </Section>

        <SiteFooter />
      </main>
    </div>
  );
}

function AgencyValue({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border-subtle p-8 shadow-sm dark:border-neutral-800">
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/10 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-text-primary mb-2">{title}</h4>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
