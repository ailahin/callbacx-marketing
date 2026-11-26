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
import { SparklesIcon, MailIcon, ShieldIcon, GlobeIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "For Influencers | Influencer Marketing Agency",
  description: "CALLBACX MARKETING works with influencers. We find brands, negotiate deals, and manage your campaigns by email — no influencer dashboard or application portal required.",
  openGraph: {
    title: "For Influencers | CALLBACX MARKETING",
    description: "CALLBACX MARKETING works with influencers. We find brands, negotiate deals, and manage your campaigns by email — no influencer dashboard or application portal required.",
    type: "website",
  },
};

const influencerBenefits = [
  {
    icon: <GlobeIcon />,
    title: "We find the brands",
    description: "We research and outreach to brands that fit your content, your voice, and your audience — you do not bid or browse for work.",
    details: ["Brand research", "Outreach & pitching", "Partnership fit", "Relationship building"],
  },
  {
    icon: <ShieldIcon />,
    title: "We negotiate fair rates",
    description: "We handle rates, deliverables, usage rights, and contracts so you get paid fairly for every campaign.",
    details: ["Rate negotiation", "Deliverable terms", "Usage rights", "Payment terms"],
  },
  {
    icon: <MailIcon />,
    title: "We manage the campaign",
    description: "Briefs, content approval, scheduling, and reporting are coordinated by email. No dashboard to log into.",
    details: ["Creative briefs", "Content approval", "Scheduling", "Reporting"],
  },
  {
    icon: <SparklesIcon />,
    title: "No application, no portal",
    description: "Influencers do not have accounts. Just contact us and tell us about your content and the brands you want to work with.",
    details: ["No registration", "No stored credentials", "Email-first coordination"],
  },
];

const influencerSteps = [
  { number: "01", title: "Contact us", description: "Email us or use the contact form and tell us about your content, audience, and the brands you would love to work with." },
  { number: "02", title: "We match you", description: "We connect you with brands whose campaigns fit your community and negotiate the deal on your behalf." },
  { number: "03", title: "Create and approve", description: "You produce the content and review the brief before anything goes live." },
  { number: "04", title: "Get paid", description: "Deliver the campaign and we handle reporting and payment terms agreed in your contract." },
];

export default function ForInfluencersPage() {
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
          title="For Influencers"
          description="Partner with brands you genuinely believe in. We find the brands, negotiate the deals, and manage the campaigns by email — you keep creative control."
          cta={{ label: "Contact Us", href: "/contact" }}
          imagePosition="none"
        />

        <Section padding="xl" id="benefits">
          <SectionTitle
            id="why-influencers-heading"
            title="Why influencers work with CALLBACX MARKETING"
            description="Agency representation, not a self-serve marketplace."
            textAlign="center"
          />
          <FeatureGrid items={influencerBenefits} />
        </Section>

        <Section padding="xl" bg="subtle" id="process">
          <SectionTitle
            id="how-influencers-heading"
            title="How it works for influencers"
            description="You focus on content. We handle the business side."
            textAlign="center"
          />
          <ProcessSteps steps={influencerSteps} />
        </Section>

        <Section padding="lg" id="cta">
          <div className="rounded-3xl bg-brand-600 p-10 lg:p-16 text-neutral-0 shadow-lg shadow-brand overflow-hidden relative text-center">
            <div className="relative z-10">
              <h2 className="text-h2 font-bold mb-4">Want us to represent you?</h2>
              <p className="text-brand-100 mb-8 max-w-xl mx-auto leading-relaxed">
                Tell us about your content and the brands you want to work with. We will review your inquiry
                and get back to you by email.
              </p>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contact Us</Link>
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
