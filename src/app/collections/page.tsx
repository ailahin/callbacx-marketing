"use client";

/**
 * CALLBACX — /collections
 *
 * Current profile's creator collections.
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, EmptyState, NoDataState } from "@/components";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  creator_profile_id: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/collections")
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || "Failed to load collections");
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setCollections(data.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setLoading(false);
        console.error(err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <EmptyState title="Loading collections" description="Please wait." />
    </div>
  );

  if (collections.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <NoDataState title="No collections yet" description="Create your first collection to organise saved creators." />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-text-primary">Collections</CardTitle>
              <p className="text-text-secondary">
                Organise your saved creators into collections. {collections.length} collection(s).
              </p>
            </CardHeader>
          </div>
          <div className="flex-shrink-0">
            <Link href="/collections/create">
              <Button>Create collection</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card key={collection.id}>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-text-primary">{collection.name}</h3>
                {collection.description && (
                  <p className="mt-2 text-sm text-text-secondary">{collection.description}</p>
                )}
                <p className="mt-4 text-xs text-text-tertiary">
                  {collection.is_public ? "Public" : "Private"} collection
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
