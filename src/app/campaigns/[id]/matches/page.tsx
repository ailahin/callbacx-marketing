"use client";

/**
 * CALLBACX — /campaigns/[id]/matches
 *
 * Campaign-to-creator matching page. Calls the matching API and displays
 * ranked results with explainable scores.
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, NoDataState } from "@/components";
import { MatchScoreBadge } from "@/components/discovery";
import Link from "next/link";

interface MatchResult {
  creator: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    categories: Array<{ id: string; name: string; slug: string }>;
  };
  overallScore: number;
  breakdown: Array<{
    criterion: string;
    score: number;
    weight: number;
    contributed: number;
    reason: string;
    verified: boolean;
  }>;
}

export default function CampaignMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [matches, setMatches] = React.useState<MatchResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    params.then(async ({ id }) => {
      setCampaignId(id);
      setLoading(true);
      try {
        const res = await fetch("/api/matching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || "Failed to load matches");
        }
        const data = await res.json();
        if (!mounted) return;
        setMatches(data.data?.matches ?? []);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load matches");
      } finally {
        if (mounted) setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <EmptyState title="Loading matches" description="Please wait while we find matches." />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <NoDataState title="Unable to load matches" description={error} />
    </div>
  );

  if (matches.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <NoDataState title="No matches" description="No creators matched this campaign's criteria." />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <CardHeader className="mb-6">
          <CardTitle className="text-2xl font-bold text-text-primary">Creator matches</CardTitle>
          <p className="text-text-secondary">
            {matches.length} creator(s) matched for campaign {campaignId}.
          </p>
        </CardHeader>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {matches.map((match) => (
            <Card key={match.creator.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{match.creator.display_name}</h3>
                    <p className="text-xs text-text-tertiary">ID: {match.creator.id.slice(0, 8)}…</p>
                  </div>
                  <MatchScoreBadge score={match.overallScore} breakdown={match.breakdown as import("@/services/matching").MatchFactor[]} />
                </div>

                <div className="mb-4">
                  {match.creator.categories.slice(0, 3).map((cat) => (
                    <span key={cat.id} className="inline-flex items-center gap-1 px-2 py-1 bg-surface border border-border-subtle rounded-md text-xs text-text-secondary dark:bg-neutral-800 dark:border-neutral-700">
                      {cat.name}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 text-xs">
                  {match.breakdown.map((factor) => (
                    <div key={factor.criterion} className="flex items-center gap-2">
                      <span className="w-20 text-text-secondary">{factor.criterion}</span>
                      <span className="text-text-primary">{factor.contributed.toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/discover/${match.creator.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-brand-600 underline hover:text-brand-700"
                >
                  View profile <span className="h-3 w-3">→</span>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
