"use client";

/**
 * CALLBACX — /favorites
 *
 * Current profile's favourited creators.
 */

import * as React from "react";
import { Card, CardHeader, CardTitle, EmptyState, NoDataState } from "@/components";
import { CreatorCard } from "@/components/discovery";
import { useToast } from "@/components/ui/Toast";
import type { CreatorListItem } from "@/services/creators";

export default function FavoritesPage() {
  const { toast } = useToast();
  const [creators, setCreators] = React.useState<CreatorListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/favorites")
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || "Failed to load favourites");
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setCreators(data.data?.creators ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setLoading(false);
        toast({ variant: "error", message: err instanceof Error ? err.message : "Failed to load favourites" });
      });
    return () => {
      mounted = false;
    };
  }, [toast]);

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
        prev.filter((c) => c.id !== creatorId || (c.id === creatorId && (data.data?.is_favorited ?? false)))
      );
    } catch {
      toast({ variant: "error", message: "Could not update favourite." });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <EmptyState title="Loading favourites" description="Please wait." />
    </div>
  );

  if (creators.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <NoDataState title="No favourites yet" description="You haven't favourited any creators yet." />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-text-primary">Your favourites</CardTitle>
            <p className="text-text-secondary">
              Creators you've saved. {creators.length} creator(s).
            </p>
          </CardHeader>
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
