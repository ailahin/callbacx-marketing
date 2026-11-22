import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { TargetIcon, UsersIcon, ShieldIcon, DocumentIcon, PlayIcon, TrendingUpIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "For Brands | Influencer Marketing Platform",
  description: "CALLBACX TECHNOLOGY helps brands run influencer marketing campaigns with vetted creators â€” from discovery to reporting.",
  openGraph: {
    title: "For Brands | CALLBACX TECHNOLOGY",
    description: "CALLBACX TECHNOLOGY helps brands run influencer marketing campaigns with vetted creators â€” from discovery to reporting.",
    type: "website",
  },
};

export default function ForBrandsPage() {
  const brandBenefits = [
    {
      icon: <UsersIcon />,
      title: "Vetted creator network",
      description: "Creators are reviewed for audience quality, authentic engagement, and brand safety before any match.",
    },
    {
      icon: <TargetIcon />,
      title: "Audience-aligned matches",
      description: "We match you with creators whose audiences fit your category â€” relevance over raw reach.",
    },
    {
      icon: <ShieldIcon />,
      title: "End-to-end campaign management",
      description: "Briefs, contracts, content approval, scheduling, and performance reporting in one place.",
    },
    {
      icon: <TrendingUpIcon />,
      title: "Transparent reporting",
      description: "Clear insight into reach, engagement, and conversions for every campaign you run.",
    },
  ];

  const brandSteps = [
    { number: "01", title: "Create your brief", description: "Share your goals, audience, budget, and timeline." },
    { number: "02", title: "Review creator matches", description: "CALLBACX TECHNOLOGY surfaces vetted creators who fit your brand. You approve the matches." },
    { number: "03", title: "Approve content", description: "Creators submit content for your review before anything goes live." },
    { number: "04", title: "Launch & measure", description: "Your campaign runs across social platforms, with full reporting afterward." },
  ];

  const serviceHighlights = [
    {
      icon: <TargetIcon />,
      title: "Campaign strategy",
      description: "Goal setting, audience definition, and creator selection criteria built for your brand.",
    },
    {
      icon: <UsersIcon />,
      title: "Creator discovery",
      description: "Sourcing and vetting creators across niches and audience sizes.",
    },
    {
      icon: <DocumentIcon />,
      title: "Contracts & rights",
      description: "Agreements, usage rights, deliverables, and timelines handled transparently.",
    },
    {
      icon: <PlayIcon />,
      title: "Content approval",
      description: "Creative briefs and review rounds keep every post on brand.",
    },
  ];

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
          description="Run influencer marketing campaigns with a vetted network of creators â€” managed end to end, with transparent reporting."
          imageSrc="https://picsum.photos/seed/callbacxtechnology-brands/1000/700"
          imageAlt="Placeholder: brand campaign visual"
          cta={{ label: "Start a Campaign", href: "/contact" }}
          imagePosition="right"
        />

        <section aria-labelledby="why-brands-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Why CALLBACX TECHNOLOGY for brands" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {brandBenefits.map((benefit, index) => (
                <BenefitCard key={index} icon={benefit.icon} title={benefit.title} description={benefit.description} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-subtle/50 dark:bg-surface-subtle/30" aria-labelledby="how-brands-heading">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <SectionTitle title="How it works for brands" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="space-y-8">
                {brandSteps.map((step, index) => (
                  <StepCard key={index} number={step.number} title={step.title} description={step.description} />
                ))}
              </div>
              <div className="relative">
                <div className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
                  <div className="w-full h-[340px] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-text-tertiary text-sm">
                    <svg className="w-24 h-24 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1.55M7 21H4a2 2 0 01-2-2v-5a2 2 0 012-2h7l-1 1.55M15.428 15.428A2 2 0 0114.029 20h-5.057a2 2 0 01-1.943-1.856l-.768-3.5a2 2 0 01.455-1.495l2.384-.477a6 6 0 004.78-.782M12 9v3m0 0v3m0-3h3m-3 0h-3" />
                    </svg>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 p-4">
                    <p className="text-xs text-text-tertiary">Placeholder visual â€” replace with brand imagery.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="services-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Our services for brands" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-3">
              {serviceHighlights.map((service, index) => (
                <ServiceCard key={index} icon={service.icon} title={service.title} description={service.description} />
              ))}
            </div>
            <div className="mt-12 lg:mt-16 text-center">
              <p className="text-lg text-text-secondary mb-6">See the full range of services</p>
              <Button asChild size="lg" variant="outline">
                <Link href="/services">View all services <span className="ml-2 text-sm">â†’</span></Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Illustrative pricing" description="Pricing shown below is illustrative placeholder content â€” actual pricing depends on campaign scope and creator rates." textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-6 md:grid-cols-3">
              <PricingTier
                name="Starter"
                price="Contact us"
                description="For brands running their first creator campaign."
                features={["One campaign", "Up to 3 creators", "Basic reporting"]}
                highlighted={false}
              />
              <PricingTier
                name="Growth"
                price="Contact us"
                description="For brands scaling creator partnerships."
                features={["Multiple campaigns", "Up to 10 creators", "Advanced reporting", "Dedicated support"]}
                highlighted={true}
              />
              <PricingTier
                name="Enterprise"
                price="Contact us"
                description="For ongoing creator programs at scale."
                features={["Unlimited campaigns", "Custom creator network", "Full-service management", "Dedicated account manager"]}
                highlighted={false}
              />
            </div>
            <p className="mt-10 text-center text-sm text-text-tertiary max-w-2xl mx-auto">
              All pricing is illustrative and subject to discussion. Contact us for a quote tailored to your campaign.
            </p>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-surface border border-border-subtle p-10 lg:p-16 text-center shadow-sm dark:border-neutral-800">
              <h2 className="text-h2 font-bold mb-4">Ready to start your first campaign?</h2>
              <p className="text-text-secondary mb-8 max-w-xl mx-auto">Tell us about your goals and we will match you with the right creators.</p>
              <Button asChild size="lg" variant="primary">
                <Link href="/contact">Start a Campaign</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-surface border border-border-subtle p-6 shadow-sm dark:border-neutral-800">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
          {icon}
        </div>
        <div>
          <h4 className="text-base font-semibold text-text-primary">{title}</h4>
        </div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold shadow-sm shadow-brand">
        {number}
      </div>
      <div>
        <h4 className="text-base font-semibold text-text-primary">{title}</h4>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="p-8 h-full flex flex-col">
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed flex-1">{description}</p>
    </Card>
  );
}

function PricingTier({ name, price, description, features, highlighted }: { name: string; price: string; description: string; features: string[]; highlighted: boolean }) {
  return (
    <Card className={`p-8 h-full flex flex-col relative ${highlighted ? "ring-2 ring-brand-600 dark:ring-brand-400" : ""}`}>
      {highlighted && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-brand-600 text-[10px] font-bold text-white uppercase tracking-wider">Popular</span>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{name}</h3>
      <p className="text-2xl font-bold text-text-primary mb-3">{price}</p>
      <p className="text-sm text-text-secondary mb-6">{description}</p>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">âœ“</span>
            {feature}
          </li>
        ))}
      </ul>
      <Button variant={highlighted ? "primary" : "outline"} className="w-full">
        Get a quote
      </Button>
    </Card>
  );
}


