"use client";

/**
 * CALLBACX — /discover
 *
 * Creator discovery page: filterable grid of public creator profiles.
 * Client component; calls the discovery API.
 */

import * as React from "react";
import {
  CreatorFilterPanel,
  CreatorCard,
} from "@/components/discovery";
import { Card, CardHeader, CardTitle, EmptyState, NoResultsState } from "@/components";
import { useToast } from "@/components/ui/Toast";
import type { DiscoveryFilters } from "@/components/discovery";
import type { CreatorListItem } from "@/services/creators";

export default function DiscoverPage() {
  const { toast } = useToast();
  const [filters, setFilters] = React.useState<DiscoveryFilters>({
    sortBy: "created_at",
    sortOrder: "desc",
    limit: 20,
    offset: 0,
  });
  const [creators, setCreators] = React.useState<CreatorListItem[]>([]);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.nicheId) params.set("nicheId", filters.nicheId);
    if (filters.platform) params.set("platform", filters.platform);
    if (filters.audienceSize) params.set("audienceSize", filters.audienceSize);
    if (filters.minEngagementRate !== undefined) params.set("minEngagementRate", String(filters.minEngagementRate));
    if (filters.maxEngagementRate !== undefined) params.set("maxEngagementRate", String(filters.maxEngagementRate));
    if (filters.minFollowers !== undefined) params.set("minFollowers", String(filters.minFollowers));
    if (filters.maxFollowers !== undefined) params.set("maxFollowers", String(filters.maxFollowers));
    if (filters.language) params.set("language", filters.language);
    if (filters.location) params.set("location", filters.location);
    if (filters.availability) params.set("availability", filters.availability);
    if (filters.verificationStatus) params.set("verificationStatus", filters.verificationStatus);
    if (filters.minRate !== undefined) params.set("minRate", String(filters.minRate));
    if (filters.maxRate !== undefined) params.set("maxRate", String(filters.maxRate));
    if (filters.search) params.set("search", filters.search);
    params.set("sortBy", filters.sortBy);
    params.set("sortOrder", filters.sortOrder);
    params.set("limit", String(filters.limit));
    params.set("offset", String(filters.offset));

    fetch(`/api/discover/creators?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || "Failed to load creators");
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setCreators(data.data?.creators ?? []);
        setCount(data.data?.count ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setLoading(false);
        toast({ variant: "error", message: err.message || "Failed to load creators" });
      });
    return () => {
      mounted = false;
    };
  }, [filters, toast]);

  const handleFavoriteToggle = async (creatorId: string, isFavorited: boolean) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator_profile_id: creatorId }),
      });
      if (!res.ok) throw new Error("Failed to update favourite");
      const data = await res.json();
      setCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId ? { ...c, is_favorited: data.data?.is_favorited ?? !isFavorited } : c
        )
      );
    } catch {
      toast({ variant: "error", message: "Could not update favourite." });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <EmptyState title="Loading creators" description="Please wait while we fetch creators." />
    </div>
  );

  if (creators.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <NoResultsState title="No results" description="No creators match your current filters." />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div className="flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-text-primary">Discover creators</CardTitle>
              <p className="text-text-secondary">
                Find and compare creators for your next campaign. {count} creators available.
              </p>
            </CardHeader>
          </div>
          <div className="flex-shrink-0 w-full lg:w-[360px]">
            <CreatorFilterPanel
              filters={filters}
              categories={[]}
              niches={[]}
              onChange={setFilters}
              count={count}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {creators.map((creator) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              showFavorite
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
