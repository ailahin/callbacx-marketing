import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * PhilosophySection - CALLBACX MARKETING brand philosophy and mission.
 */
export function PhilosophySection() {
  return (
    <section className="bg-surface-subtle/50 dark:bg-surface-subtle/30" aria-labelledby="philosophy-heading">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <SectionTitle
          id="philosophy-heading"
          title="Our brand philosophy"
          description="Woven with intention. Influencer marketing at its best is a partnership — not a transaction."
          textAlign="center"
        />

        <div className="mt-12 lg:mt-16 max-w-3xl mx-auto space-y-6 text-center">
          <p className="text-lg text-text-secondary leading-relaxed">
            CALLBACX MARKETING was built on a simple belief: the best brand stories are told by the creators audiences
            already follow and trust. We exist to make those connections simple, transparent, and rewarding for everyone
            involved.
          </p>
          <p className="text-lg text-text-secondary leading-relaxed">
            Whether you are a brand launching your first campaign or a creator looking for the right partnerships,
            CALLBACX MARKETING provides the platform, process, and support to make it happen.
          </p>
        </div>
      </div>
    </section>
  );
}


