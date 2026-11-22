import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  SparklesIcon,
  UsersIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

/**
 * HeroSection - Premium homepage hero with headline, CTAs, and hero visual.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Decorative thread elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] -z-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="heroThreadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-brand-100)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--color-accent-100)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            d="M0 50 Q 300 0, 600 100 T 1200 400"
            fill="none"
            stroke="url(#heroThreadGradient)"
            strokeWidth="3"
            strokeDasharray="40 20"
            className="[mask-image:radial-gradient(circle_at_center,transparent_40%,black_60%)]"
            aria-hidden="true"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-6 pt-8 lg:pt-16 pb-8 lg:pb-24">
            <div className="inline-flex items-center gap-2 rounded-lg bg-brand-50/60 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-100/50 dark:border-brand-900/30">
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>The influencer marketing platform</span>
            </div>
            <h1 id="hero-heading" className="text-display-lg font-bold text-text-primary tracking-tight leading-snug">
              Brand stories, told by the creators audiences trust.
            </h1>
<p className="text-lg text-text-secondary leading-relaxed max-w-lg">
              CALLBACX MARKETING connects brands with vetted creators to run influencer campaigns
              that drive awareness, engagement, and results — without the guesswork.
              One platform for discovery, contracts, content approval, and reporting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" variant="primary" leftIcon={<ArrowRightIcon />}>
                <Link href="/contact">Start a Campaign</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/services">Explore Services</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 text-sm text-text-tertiary">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <UsersIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <span>Vetted creators &bull; aligned audiences &bull; transparent reporting</span>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative h-[520px] lg:h-[640px] flex items-center justify-center">
            <div className="relative w-full h-full rounded-3xl overflow-hidden border border-border-subtle shadow-lg ring-1 ring-border-subtle/50">
              <Image
                src="https://picsum.photos/seed/callbacxtechnology-hero/1200/900"
                alt="Placeholder: modern creative workspace"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-0/80 dark:bg-neutral-900/80 backdrop-blur px-4 py-3 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sage-500" />
                    <span className="text-sm font-medium text-text-primary">Platform status: Active</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-text-tertiary border-l pl-4">
                    <span>99.8% uptime this month</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -left-6 flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-14 h-14 rounded-full border border-border-default bg-neutral-0/60 dark:bg-neutral-900/60 backdrop-blur flex items-center justify-center shadow-lg ring-1 ring-white/20">
                  <span className="text-[10px] font-medium text-text-secondary">{i === 1 ? "B" : i === 2 ? "U" : "N"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * ContactCard - lightweight contact detail card used across pages
 */
export function ContactCard({ label, value, href, icon }: { label: string; value: string; href?: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-text-tertiary">{label}</p>
        {href ? (
          <Link href={href} className="text-base font-medium text-text-primary hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded p-1">
            {value}
          </Link>
        ) : (
          <p className="text-base font-medium text-text-primary break-all">{value}</p>
        )}
      </div>
    </div>
  );
}


