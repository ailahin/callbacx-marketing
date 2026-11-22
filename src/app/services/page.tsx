import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { TargetIcon, UsersIcon, DocumentIcon, PlayIcon, TrendingUpIcon, EyeIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Services | Influencer Marketing Services",
  description: "CALLBACX TECHNOLOGY influencer marketing services: campaign strategy, creator discovery, contracts, content approval, and performance reporting.",
  openGraph: {
    title: "Services | CALLBACX TECHNOLOGY",
    description: "CALLBACX TECHNOLOGY influencer marketing services: campaign strategy, creator discovery, contracts, content approval, and performance reporting.",
    type: "website",
  },
};

export default function ServicesPage() {
  const services = [
    {
      icon: <TargetIcon />,
      title: "Campaign Strategy & Planning",
      description: "We help you define goals, target audience, budget, timeline, and creator selection criteria before a single contract is signed.",
      details: ["Goal and KPI definition", "Audience and platform strategy", "Budget allocation", "Creator selection criteria"],
    },
    {
      icon: <UsersIcon />,
      title: "Creator Discovery & Vetting",
      description: "We source creators across niches and audience sizes, then vet them for audience quality, authentic engagement, and brand safety.",
      details: ["Creator sourcing", "Audience quality review", "Engagement authenticity check", "Brand safety screening"],
    },
    {
      icon: <DocumentIcon />,
      title: "Contract & Rights Management",
      description: "Agreements, usage rights, deliverables, timelines, and compensation terms are handled transparently for both brands and creators.",
      details: ["Campaign agreements", "Usage rights and licensing", "Deliverable schedules", "Compensation terms"],
    },
    {
      icon: <PlayIcon />,
      title: "Content Production & Approval",
      description: "Creative briefs, content review rounds, and approval workflows keep every post on brand and on schedule.",
      details: ["Creative briefs", "Review and revision rounds", "Content calendar", "Publishing coordination"],
    },
    {
      icon: <EyeIcon />,
      title: "Campaign Launch & Management",
      description: "Campaigns go live across social platforms with monitoring, pacing, and mid-campaign adjustments as needed.",
      details: ["Launch coordination", "Pacing and monitoring", "Mid-campaign optimization", "Issue escalation"],
    },
    {
      icon: <TrendingUpIcon />,
      title: "Performance Tracking & Reporting",
      description: "Clear campaign reports covering reach, engagement, clicks, and conversions â€” so you know what worked and why.",
      details: ["Reach and impressions", "Engagement metrics", "Click and conversion tracking", "Final campaign report"],
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
          title="Our services"
          description="End-to-end influencer marketing support for brands and creators â€” from the first brief to the final report."
          imageSrc="https://picsum.photos/seed/callbacxtechnology-services/1000/700"
          imageAlt="Placeholder: services visual"
          cta={{ label: "Start a Campaign", href: "/contact" }}
          imagePosition="right"
        />

        <section aria-labelledby="services-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="What we offer" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-3">
              {services.map((service, index) => (
                <ServiceCard key={index} service={service} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-subtle/50 dark:bg-surface-subtle/30" aria-labelledby="process-heading">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <SectionTitle title="How we work with you" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid md:grid-cols-3 gap-10 lg:gap-16 items-center">
              <ProcessStep number="01" title="Discovery" description="We learn about your goals, brand, and the outcomes you want from a campaign." />
              <ProcessStep number="02" title="Matching" description="You review vetted creator matches and choose the partners that fit your campaign." />
              <ProcessStep number="03" title="Execution" description="Content is produced, approved, and published â€” with you in control at every step." />
              <ProcessStep number="04" title="Reporting" description="You receive a clear performance report with insights for your next campaign." />
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Frequently asked questions" textAlign="center" />
            <div className="mt-16 lg:mt-24 space-y-4 max-w-3xl mx-auto">
              <FaqItem
                question="How does CALLBACX TECHNOLOGY vet creators?"
                answer="Creators are reviewed for audience quality, authentic engagement, and brand safety before they can be matched with campaigns."
              />
              <FaqItem
                question="What does a campaign cost?"
                answer="Pricing depends on campaign scope, creator rates, and deliverables. Contact us for a quote tailored to your needs â€” all pricing shown on this site is illustrative."
              />
              <FaqItem
                question="Can creators choose which brands to work with?"
                answer="Yes. Creators review campaign briefs and decide which partnerships fit their content and audience."
              />
              <FaqItem
                question="Who owns the content created during a campaign?"
                answer="Usage rights and ownership are set out in the campaign agreement, so both brands and creators know exactly what is permitted."
              />
              <FaqItem
                question="How is performance measured?"
                answer="Campaigns are reported on reach, engagement, clicks, and conversions where trackable, with a final report delivered at the end of each campaign."
              />
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-surface border border-border-subtle p-10 lg:p-16 text-center shadow-sm dark:border-neutral-800">
              <h2 className="text-h2 font-bold mb-4">Which service fits your campaign?</h2>
              <p className="text-text-secondary mb-8 max-w-xl mx-auto">Tell us about your goals and we will recommend the right creators and services.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="primary">
                  <Link href="/contact">Start a Campaign</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/how-it-works">Learn How It Works</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ServiceCard({ service }: { service: { icon: React.ReactNode; title: string; description: string; details: string[] } }) {
  return (
    <Card className="p-8 h-full flex flex-col">
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5">
        {service.icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-3">{service.title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed flex-1 mb-6">{service.description}</p>
      <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Included</h4>
      <ul className="space-y-2 mb-8 flex-1">
        {service.details.map((detail, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">â€”</span>
            {detail}
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="w-full">
        Learn more
      </Button>
    </Card>
  );
}

function ProcessStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white font-semibold shadow-sm shadow-brand">
        {number}
      </div>
      <h4 className="text-base font-semibold text-text-primary">{title}</h4>
      <p className="text-sm text-text-secondary leading-relaxed max-w-xs">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border border-border-subtle rounded-xl dark:border-neutral-800">
      <details className="group">
        <summary
          className="flex items-center justify-between w-full px-6 py-4 list-none cursor-pointer font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <span>{question}</span>
          <svg className="h-4 w-4 transition-transform group-open:rotate-180 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-6 pb-4 text-text-secondary text-sm leading-relaxed">{answer}</div>
      </details>
    </div>
  );
}


