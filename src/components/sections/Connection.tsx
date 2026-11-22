"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UsersIcon, GlobeIcon, ShieldIcon, ArrowRightIcon } from "@/components/ui/icons";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * ConnectionSection - explains the connection between brands and creators.
 */
export function ConnectionSection() {
  const features = [
    {
      icon: <UsersIcon />,
      title: "Vetted creators",
      description: "Creators are reviewed for audience quality, engagement authenticity, and brand safety before they join.",
    },
    {
      icon: <GlobeIcon />,
      title: "Aligned audiences",
      description: "Matches are based on audience fit and content relevance â€” not follower count alone.",
    },
    {
      icon: <ShieldIcon />,
      title: "Managed campaigns",
      description: "From brief to reporting, CALLBACX TECHNOLOGY handles the coordination so both sides can focus on great content.",
    },
  ];

  return (
    <section className="relative overflow-hidden" aria-labelledby="connection-heading">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <SectionTitle
          title="The connection between brands and creators"
          description="CALLBACX TECHNOLOGY bridges the gap between brands that have stories to tell and creators who already hold the attention of the audiences those brands want to reach."
          textAlign="center"
        />

        <div className="mt-16 lg:mt-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <UsersIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">For brands</h3>
                <p className="mt-2 text-text-secondary leading-relaxed">
                  Access a curated network of creators across niches, run campaigns end to end, and measure what
                  actually matters â€” reach, engagement, and conversions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-50 dark:bg-accent-950/50 flex items-center justify-center text-accent-600 dark:text-accent-400">
                <GlobeIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">For creators</h3>
                <p className="mt-2 text-text-secondary leading-relaxed">
                  Partner with brands you genuinely love, keep creative control of your content, and get paid fairly
                  through simple contracts and transparent payments.
                </p>
              </div>
            </div>
            <div className="pt-6">
              <Button asChild size="lg" variant="primary" leftIcon={<ArrowRightIcon />}>
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
              <Image
                src="https://picsum.photos/seed/callbacxtechnology-connection/900/700"
                alt="Placeholder: brand and creator collaborating"
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-0/50 dark:from-neutral-900/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-6">
                <p className="text-sm font-medium text-text-primary">One thread, two sides.</p>
                <p className="text-xs text-text-tertiary mt-1">Placeholder visual â€” replace with brand imagery.</p>
              </div>
            </div>
            <div className="absolute -right-10 top-1/4 -translate-y-1/2 flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border border-border-default bg-neutral-0 dark:bg-neutral-900 flex items-center justify-center shadow-lg ring-1 ring-white/20 text-[10px] font-medium text-text-secondary">
                  C{i}
                </div>
              ))}
            </div>
            <div className="absolute -left-10 bottom-1/4 -translate-y-1/2 flex gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border border-border-default bg-neutral-0 dark:bg-neutral-900 flex items-center justify-center shadow-lg ring-1 ring-white/20 text-[10px] font-medium text-text-secondary">
                  B{i}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 lg:mt-24 border-t border-border-subtle pt-12 lg:pt-16">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-surface border border-border-subtle p-6 shadow-sm hover:shadow-md transition-all dark:border-neutral-800">
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-text-primary mb-2">{title}</h4>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}


