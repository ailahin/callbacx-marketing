"use client";

import { CheckIcon, ShieldIcon, TargetIcon, UsersIcon } from "@/components/ui/icons";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils";

/**
 * PhilosophySection - CALLBACX MARKETING brand philosophy with values cards.
 */
export function PhilosophySection() {
  const values = [
    {
      icon: <CheckIcon />,
      title: "Authenticity first",
      description: "We believe the most powerful endorsements come from genuine creator-audience relationships, not scripted ads.",
    },
    {
      icon: <ShieldIcon />,
      title: "Meaningful connections",
      description: "Every campaign is a thread connecting a brand to a creator, and a creator to the people who trust them.",
    },
    {
      icon: <TargetIcon />,
      title: "Audience alignment",
      description: "We match brands with creators whose audiences actually fit â€” relevance over raw reach.",
    },
    {
      icon: <UsersIcon />,
      title: "Transparent partnership",
      description: "Clear contracts, fair compensation, and open reporting for both brands and creators.",
    },
  ];

  return (
    <section className="bg-surface-subtle/50 dark:bg-surface-subtle/30" aria-labelledby="philosophy-heading">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <SectionTitle
          title="Our brand philosophy"
          description="Woven with intention. Influencer marketing at its best is a partnership â€” not a transaction."
          textAlign="center"
        />

        <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <CardVariant key={index} icon={value.icon} title={value.title} description={value.description} />
          ))}
        </div>

        <div className="mt-16 lg:mt-24 border-t border-border-subtle pt-12 lg:pt-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
<p className="text-lg text-text-secondary leading-relaxed">
                CALLBACX MARKETING was built on a simple belief: the best brand stories are told by the creators audiences already
                follow and trust. We exist to make those connections simple, transparent, and rewarding for everyone
                involved.
              </p>
              <p className="text-lg text-text-secondary leading-relaxed">
                Whether you are a brand launching your first campaign or a creator looking for the right partnerships,
                CALLBACX MARKETING provides the platform, process, and support to make it happen.
              </p>
            </div>
            <div className="relative h-[360px] hidden lg:block">
              <div className="absolute inset-0 rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
                <ImagePlaceholder className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-0/30 dark:via-neutral-900/30 to-neutral-0/60 dark:to-neutral-900/60" />
                <div className="absolute bottom-6 left-6 right-6 p-6">
                  <p className="text-sm font-medium text-text-primary">Every connection is a thread.</p>
                  <p className="text-xs text-text-tertiary mt-1">Placeholder visual â€” replace with brand imagery.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CardVariant({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border-subtle p-8 shadow-sm transition-all hover:shadow-md dark:border-neutral-800">
      <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * ImagePlaceholder - decorative placeholder image with clear labeling
 */
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-text-tertiary text-sm", className)}>
      <svg className="w-16 h-16 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
      </svg>
      <div>Illustrative placeholder image</div>
    </div>
  );
}


