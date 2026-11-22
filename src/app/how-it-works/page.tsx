import * as React from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { DocumentIcon, UsersIcon, PlayIcon, ShieldIcon, SparklesIcon, TrendingUpIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "How It Works | CALLBACX MARKETING",
  description: "How CALLBACX MARKETING works for brands and creators — from brief to campaign report.",
  openGraph: {
    title: "How It Works | CALLBACX MARKETING",
    description: "How CALLBACX MARKETING works for brands and creators — from brief to campaign report.",
    type: "website",
  },
};

export default function HowItWorksPage() {
const brandSteps = [
    { number: "01", title: "Create your brief", description: "Share your campaign goals, audience, budget, and timeline. We help you shape it." },
    { number: "02", title: "Review creator matches", description: "CALLBACX MARKETING surfaces vetted creators who fit your brand. You review and approve the matches." },
    { number: "03", title: "Approve content", description: "Creators submit content for your review before anything goes live." },
    { number: "04", title: "Launch the campaign", description: "Approved content goes live across social platforms while performance is monitored." },
    { number: "05", title: "Get the report", description: "You receive a clear report on reach, engagement, and results." },
  ];

  const creatorSteps = [
    { number: "01", title: "Apply to join", description: "Tell us about your content, audience, and the brands you would love to work with." },
    { number: "02", title: "Get matched", description: "CALLBACX MARKETING connects you with campaigns and brands that fit your community." },
    { number: "03", title: "Create content", description: "Produce content to the agreed brief and submit it for brand approval." },
    { number: "04", title: "Publish", description: "Once approved, publish to your channels as scheduled." },
    { number: "05", title: "Get paid", description: "Deliver the campaign and receive payment through CALLBACX MARKETING." },
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
          title="How it works"
          description="A simple, transparent process for both sides of every partnership â€” from brief to report."
          imageSrc="https://picsum.photos/seed/callbacxtechnology-how-it-works/1000/700"
          imageAlt="Placeholder: process visual"
          imagePosition="none"
        />

        <section aria-labelledby="two-sides-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Two sides, one process" description="CALLBACX MARKETING works the same transparent way whether you are a brand or a creator." textAlign="center" />
            <div className="mt-16 lg:mt-24 grid lg:grid-cols-2 gap-16">
              <ProcessColumn
                title="For brands"
                icon={<ShieldIcon />}
                steps={brandSteps}
                cta={{ label: "Start a Campaign", href: "/contact" }}
              />
              <ProcessColumn
                title="For creators"
                icon={<SparklesIcon />}
                steps={creatorSteps}
                cta={{ label: "Apply to Join", href: "/registration" }}
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="together-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="What happens when a brand and creator connect" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-3 lg:grid-cols-4">
              <ThreadStep
                icon={<DocumentIcon />}
                title="The brief"
                description="Brand shares goals, audience, budget, and deliverables."
              />
              <ThreadStep
                icon={<UsersIcon />}
                title="The match"
                description="Creator is matched based on audience fit â€” not follower count alone."
              />
              <ThreadStep
                icon={<PlayIcon />}
                title="The content"
                description="Creator produces content; brand reviews and approves before publishing."
              />
              <ThreadStep
                icon={<TrendingUpIcon />}
                title="The report"
                description="Campaign results â€” reach, engagement, conversions â€” delivered to both sides."
              />
            </div>
            <div className="mt-12 lg:mt-16 text-center">
<p className="text-sm text-text-tertiary max-w-2xl mx-auto">
                Steps shown are the standard CALLBACX MARKETING process. Timelines and deliverables vary by campaign.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-surface border border-border-subtle p-10 lg:p-16 text-center shadow-sm dark:border-neutral-800">
              <h2 className="text-h2 font-bold mb-4">Ready to get started?</h2>
              <p className="text-text-secondary mb-8 max-w-xl mx-auto">Choose your role and take the first step.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="primary">
                  <Link href="/contact">Start a Campaign</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/registration">Apply to Join</Link>
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

function ProcessColumn({ title, icon, steps, cta }: { title: string; icon: React.ReactNode; steps: Array<{ number: string; title: string; description: string }>; cta: { label: string; href: string } }) {
  return (
    <div className="rounded-2xl bg-surface border border-border-subtle p-8 shadow-sm dark:border-neutral-800">
      <div className="flex items-start gap-3 mb-8">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-sm`}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </div>
      <ol className="space-y-6" role="list">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold shadow-sm shadow-brand">
              {step.number}
            </div>
            <div>
              <h4 className="text-base font-semibold text-text-primary">{step.title}</h4>
              <p className="text-sm text-text-secondary">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-10 pt-6 border-t border-border-subtle dark:border-neutral-800">
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      </div>
    </div>
  );
}

function ThreadStep({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-surface border border-border-subtle p-6 text-center dark:border-neutral-800">
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mx-auto mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-text-primary mb-2">{title}</h4>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}


