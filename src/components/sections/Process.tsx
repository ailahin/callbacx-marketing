import { SectionTitle } from "@/components/ui/SectionTitle";
import { DocumentIcon, UsersIcon, PlayIcon, EyeIcon, TrendingUpIcon } from "@/components/ui/icons";

/**
 * ProcessSection - the campaign process, step by step.
 */
export function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Brief",
      icon: <DocumentIcon />,
      description: "Share your goals, target audience, budget, and timeline. We help you shape the campaign brief.",
    },
    {
      number: "02",
      title: "Match",
      icon: <UsersIcon />,
      description: "CALLBACX MARKETING matches you with vetted creators whose audiences fit your brand. You review and approve the matches.",
    },
    {
      number: "03",
      title: "Launch",
      icon: <PlayIcon />,
      description: "Creators produce and submit content for your approval. Everything goes live only after you sign off.",
    },
    {
      number: "04",
      title: "Optimize",
      icon: <EyeIcon />,
      description: "Campaigns run across social platforms while performance is monitored in real time.",
    },
    {
      number: "05",
      title: "Report",
      icon: <TrendingUpIcon />,
      description: "You receive a clear campaign report with reach, engagement, and conversion insights.",
    },
  ];

  return (
    <section className="relative" aria-labelledby="process-heading">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <SectionTitle
          id="process-heading"
          title="How campaigns work"
          description="A simple, transparent process for brands and creators — from brief to report."
          textAlign="center"
        />

        <div className="mt-16 lg:mt-24">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {steps.map((step) => (
              <ProcessStep key={step.number} step={step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessStep({ step }: { step: { number: string; title: string; description: string; icon: React.ReactNode } }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white font-semibold shadow-lg shadow-brand">
        {step.number}
      </div>
      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
        {step.icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{step.title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed max-w-xs">{step.description}</p>
    </div>
  );
}


