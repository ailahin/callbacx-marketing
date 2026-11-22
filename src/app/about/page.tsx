import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { SparklesIcon, ShieldIcon, TargetIcon, UsersIcon, GlobeIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About CALLBACX MARKETING",
  description: "Learn about CALLBACX MARKETING — the influencer marketing platform connecting brands with vetted creators.",
  openGraph: {
    title: "About CALLBACX MARKETING",
    description: "Learn about CALLBACX MARKETING — the influencer marketing platform connecting brands with vetted creators.",
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
          title="About CALLBACX MARKETING"
          description="CALLBACX MARKETING is an influencer marketing platform built on the belief that the best brand stories are told by the creators audiences already trust."
          imageSrc="https://picsum.photos/seed/callbacxmarketing-about/1000/700"
          imageAlt="Placeholder: brand story visual"
          cta={{ label: "Start a Campaign", href: "/contact" }}
          imagePosition="right"
        />

        <section aria-labelledby="story-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Our story" description="Woven with intention." textAlign="center" />
            <div className="mt-12 lg:mt-16 prose-lg text-text-secondary leading-relaxed max-w-3xl mx-auto space-y-6">
<p>
                CALLBACX MARKETING was built to make influencer marketing simpler, more transparent, and more human. Too often,
                brand-creator partnerships are complicated by mismatched expectations, unclear rights, and opaque
                reporting. We set out to change that.
              </p>
              <p>
                Our platform connects brands with vetted creators — from niche specialists to established voices —
                and handles the coordination between them: briefs, discovery, contracts, content approval, publishing,
                and reporting. Both sides get tools built for them, and both sides get clarity at every step.
              </p>
              <p>
                We call it woven with intention. Every partnership on CALLBACX MARKETING is a thread connecting a brand to a
                creator, and a creator to the people who trust them.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-surface-subtle/50 dark:bg-surface-subtle/30" aria-labelledby="mission-heading">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <SectionTitle title="Mission & vision" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-2">
              <Card className="p-8 h-full">
                <div className="flex items-start gap-3 mb-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Our mission</h3>
                  </div>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  To make influencer marketing accessible, transparent, and rewarding â€” for brands that want to tell
                  their stories and for creators who want to tell them.
                </p>
              </Card>
              <Card className="p-8 h-full">
                <div className="flex items-start gap-3 mb-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-950/50 flex items-center justify-center text-accent-600 dark:text-accent-400">
                    <GlobeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Our vision</h3>
                  </div>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  A creator economy where every partnership is built on authenticity, fair compensation, and clear
                  communication â€” with no guesswork on either side.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section aria-labelledby="values-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Our values" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-3">
              <ValueCard
                icon={<CheckMarkIcon />}
                title="Authenticity"
                description="Real creators, real audiences, real relationships â€” no manufactured engagement."
              />
              <ValueCard
                icon={<UsersIcon />}
                title="Connection"
                description="We connect brands with creators whose audiences actually fit their story."
              />
              <ValueCard
                icon={<ShieldIcon />}
                title="Transparency"
                description="Clear contracts, fair rates, open reporting, and no hidden fees."
              />
              <ValueCard
                icon={<TargetIcon />}
                title="Quality"
                description="Campaigns built around goals, audience fit, and measurable outcomes."
              />
              <ValueCard
                icon={<GlobeIcon />}
                title="Accessibility"
                description="Influencer marketing should work for brands and creators of all sizes."
              />
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-brand-600 p-10 lg:p-16 text-neutral-0 shadow-lg shadow-brand overflow-hidden relative">
              <div className="relative z-10">
                <h2 className="text-h2 font-bold mb-4">Ready to work with CALLBACX MARKETING?</h2>
                <p className="text-brand-100 mb-8 max-w-xl">
                  Whether you are a brand launching your first campaign or a creator looking for the right
                  partnerships, we would love to hear from you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" variant="outline">
                    <Link href="/contact" className="text-neutral-0 hover:text-brand-50 focus-visible:ring-brand-400 focus-visible:ring-offset-neutral-900">
                      Start a Campaign
                    </Link>
                  </Button>
                  <Button asChild size="lg">
                    <Link href="/registration" className="text-neutral-0 hover:text-brand-50 focus-visible:ring-brand-400 focus-visible:ring-offset-neutral-900">
                      Join as Creator
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-700/30 rounded-full blur-[80px]" aria-hidden="true" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border-subtle p-8 shadow-sm dark:border-neutral-800">
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-text-primary mb-2">{title}</h4>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function CheckMarkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}


