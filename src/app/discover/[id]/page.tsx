"use client";

/**
 * CALLBACX — /discover/[id]
 *
 * Creator profile detail page. Fetches the public creator profile from the
 * existing /api/creators/[id] route.
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, NoDataState } from "@/components";
import { Badge, StatusBadge, Tag } from "@/components/ui/Badge";
import { MapPinIcon, StarIcon, EyeIcon } from "@/components/ui/icons";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface CreatorProfile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: unknown;
  languages: string[];
  contact_email: string | null;
  website_url: string | null;
  availability_status: string;
  verification_status: string;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export default function CreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [creator, setCreator] = React.useState<CreatorProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    params.then(async ({ id }) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/creators/${id}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || "Failed to load creator");
        }
        const data = await res.json();
        if (!mounted) return;
        setCreator(data.data ?? null);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load creator");
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
      <EmptyState title="Loading creator" description="Please wait." />
    </div>
  );

  if (error || !creator) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <NoDataState title="Creator not found" description={error || "This creator profile does not exist."} />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0 lg:p-0">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-shrink-0 w-48 h-48 lg:w-64 lg:h-64">
                {creator.cover_url ? (
                  <img src={creator.cover_url} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface-subtle dark:bg-neutral-800/50 flex items-center justify-center">
                    <span className="text-text-tertiary">No cover image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={creator.avatar_url ?? ""}
                    alt={creator.display_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-background"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-text-primary">{creator.display_name}</h1>
                    <Badge variant={creator.verification_status === "verified" ? "success" : "default"} size="sm">
                      {creator.verification_status.charAt(0).toUpperCase() + creator.verification_status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {creator.bio && (
                  <p className="text-text-secondary leading-relaxed">{creator.bio}</p>
                )}

                {creator.contact_email && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <EyeIcon className="h-4 w-4" />
                    <button
                      onClick={() => void navigator.clipboard.writeText(creator.contact_email!)}
                      className="text-brand-600 underline hover:text-brand-700"
                    >
                      {creator.contact_email}
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {creator.categories.slice(0, 6).map((cat) => (
                    <Tag key={cat.id} variant="default" size="sm">
                      {cat.name}
                    </Tag>
                  ))}
                </div>

                <div className="space-y-2">
                  {Boolean(creator.location) && (
                    <p className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPinIcon className="h-4 w-4" />
                      <span>Location on file</span>
                    </p>
                  )}
                  {creator.languages.length > 0 && (
                    <p className="flex items-center gap-2 text-sm text-text-secondary">
                      <span>{creator.languages.join(", ")}</span>
                    </p>
                  )}
                  {creator.website_url && (
                    <p className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-brand-600 underline">{creator.website_url}</span>
                    </p>
                  )}
                  {creator.contact_email && (
                    <p className="flex items-center gap-2 text-sm text-text-secondary">
                      <EyeIcon className="h-4 w-4" />
                      <button
                      onClick={() => void navigator.clipboard.writeText(creator.contact_email!)}
                        className="text-brand-600 underline hover:text-brand-700"
                      >
                        {creator.contact_email}
                      </button>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <StatusBadge
                    status={
                      creator.availability_status === "open" ? "active" :
                        creator.availability_status === "busy" ? "pending" : "inactive"
                    }
                    showDot={false}
                  />
                  <span>{creator.availability_status === "open" ? "Open to collaborations" :
                    creator.availability_status === "busy" ? "Busy" : "Unavailable"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {creator.contact_email && (
          <div className="mt-6">
            <button
              onClick={() => void navigator.clipboard.writeText(creator.contact_email!)}
              className="text-sm text-brand-600 underline hover:text-brand-700"
            >
              Copy contact email <EyeIcon className="h-4 w-4 inline ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
