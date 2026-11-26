import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { FeatureGrid, FeatureCard } from "@/components/sections/FeatureGrid";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { TargetIcon, UsersIcon, ShieldIcon, MailIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "For Brands | Influencer Marketing Agency",
  description: "CALLBACX MARKETING runs influencer marketing campaigns for brands. We find influencers, negotiate deals, and manage your campaign by email — no brand dashboard required.",
  openGraph: {
    title: "For Brands | CALLBACX MARKETING",
    description: "CALLBACX MARKETING runs influencer marketing campaigns for brands. We find influencers, negotiate deals, and manage your campaign by email — no brand dashboard required.",
    type: "website",
  },
};

const brandBenefits = [
  {
    icon: <UsersIcon />,
    title: "We find the influencers",
    description: "We source and vet influencers for audience quality, authentic engagement, and brand fit — you do not browse or discover anyone yourself.",
    details: ["Influencer sourcing", "Audience vetting", "Engagement audit", "Brand safety"],
  },
  {
    icon: <TargetIcon />,
    title: "We negotiate the deal",
    description: "Rates, deliverables, usage rights, and timelines are negotiated by us on your behalf.",
    details: ["Rate negotiation", "Deliverable terms", "Usage rights", "Timelines"],
  },
  {
    icon: <ShieldIcon />,
    title: "We manage the campaign",
    description: "Briefs, content approval, scheduling, and reporting are handled by email from start to finish.",
    details: ["Creative briefs", "Content approval", "Scheduling", "Reporting"],
  },
  {
    icon: <MailIcon />,
    title: "No dashboard, no login",
    description: "Brands do not have accounts. You contact us by email, and we take care of everything.",
    details: ["Email-first coordination", "No stored credentials", "Data minimization"],
  },
];

const brandSteps = [
  { number: "01", title: "Contact us", description: "Email us or use the contact form with your goals, audience, budget, and timeline." },
  { number: "02", title: "We propose a plan", description: "We recommend influencers, campaign scope, and estimated costs based on your brief." },
  { number: "03", title: "We negotiate and contract", description: "We agree rates and terms with the influencers and put the campaign agreement in place." },
  { number: "04", title: "We run and report", description: "Content is produced and approved by email, then published and reported back to you." },
];

export default function ForBrandsPage() {
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
          title="For Brands"
          description="Influencer marketing campaigns run for you — we find the influencers, negotiate the deals, and manage everything by email."
          cta={{ label: "Start a Campaign", href: "/contact" }}
          imagePosition="none"
        />

        <Section padding="xl" id="benefits">
          <SectionTitle
            id="why-brands-heading"
            title="Why brands work with CALLBACX MARKETING"
            description="An agency model built around you, not a self-serve platform."
            textAlign="center"
          />
          <FeatureGrid items={brandBenefits} />
        </Section>

        <Section padding="xl" bg="subtle" id="process">
          <SectionTitle
            id="how-brands-heading"
            title="How it works for brands"
            description="You brief us. We do the rest."
            textAlign="center"
          />
          <ProcessSteps steps={brandSteps} />
        </Section>

        <Section padding="lg" id="cta">
          <div className="rounded-3xl bg-brand-600 p-10 lg:p-16 text-neutral-0 shadow-lg shadow-brand overflow-hidden relative text-center">
            <div className="relative z-10">
              <h2 className="text-h2 font-bold mb-4">Ready to run your first campaign?</h2>
              <p className="text-brand-100 mb-8 max-w-xl mx-auto leading-relaxed">
                Tell us about your goals and we will match you with the right influencers.
              </p>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Start a Campaign</Link>
              </Button>
            </div>
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-700/30 rounded-full blur-[80px]" aria-hidden="true" />
          </div>
        </Section>

        <SiteFooter />
      </main>
    </div>
  );
}
