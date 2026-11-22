"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardMedia, ProfileCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoResultsState } from "@/components/states/Empty";
import { demoData } from "@/services/demo-data";
import { isDemoMode } from "@/context/AuthProvider";
import { formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Brand Creators Page Component
// ---------------------------------------------------------------------------

export default function BrandCreatorsPage() {
  const { user, loading: authLoading } = useAuth();
  const [creators, setCreators] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState({
    search: "",
    category: "",
    platform: "",
    minFollowers: "",
    maxFollowers: "",
    sort: "followers_desc",
  });
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  React.useEffect(() => {
    async function fetchCreators() {
      if (authLoading) return;
      
      setLoading(true);
      try {
        if (isDemoMode) {
          let filtered = demoData.creatorProfiles.filter(c => c.is_active);
          
          if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(c => 
              c.display_name.toLowerCase().includes(search) || 
              c.bio?.toLowerCase().includes(search)
            );
          }
          if (filters.category) {
            // Would filter by category in production
          }
          if (filters.platform) {
            filtered = filtered.filter(c => 
              demoData.creatorSocialAccounts.some(s => s.creator_profile_id === c.id && s.platform === filters.platform)
            );
          }
          if (filters.minFollowers) {
            const min = parseInt(filters.minFollowers);
            filtered = filtered.filter(c => {
              const totalFollowers = demoData.creatorSocialAccounts
                .filter(s => s.creator_profile_id === c.id)
                .reduce((sum, s) => sum + (s.followers_count || 0), 0);
              return totalFollowers >= min;
            });
          }
          
          // Sort
          filtered.sort((a, b) => {
            const aFollowers = demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === a.id).reduce((sum, s) => sum + (s.followers_count || 0), 0);
            const bFollowers = demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === b.id).reduce((sum, s) => sum + (s.followers_count || 0), 0);
            switch (filters.sort) {
              case "followers_desc": return bFollowers - aFollowers;
              case "followers_asc": return aFollowers - bFollowers;
              case "engagement_desc": {
                const aEng = demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === a.id).reduce((sum, s) => sum + (s.engagement_rate || 0), 0) / Math.max(1, demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === a.id).length);
                const bEng = demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === b.id).reduce((sum, s) => sum + (s.engagement_rate || 0), 0) / Math.max(1, demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === b.id).length);
                return bEng - aEng;
              }
              case "name_asc": return a.display_name.localeCompare(b.display_name);
              default: return 0;
            }
          });
          
          // Add social data to each creator
          const enrichedCreators = filtered.map(creator => ({
            ...creator,
            socialAccounts: demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === creator.id),
            totalFollowers: demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === creator.id).reduce((sum, s) => sum + (s.followers_count || 0), 0),
            avgEngagement: demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === creator.id).reduce((sum, s) => sum + (s.engagement_rate || 0), 0) / Math.max(1, demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === creator.id).length),
          }));
          
          setCreators(enrichedCreators);
        } else {
          setCreators([]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, [authLoading, filters]);

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-4">
          <SkeletonCard showAvatar={true} lines={2} />
          <SkeletonCard showAvatar={true} lines={2} />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.brand_id) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Discover Creators"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No brand associated</h2>
        </div>
      </DashboardLayout>
    );
  }

  const platforms = [...new Set(demoData.creatorSocialAccounts.map(s => s.platform))];

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Discover Creators"
      description="Find the perfect creators for your campaigns"
      user={user}
    >
      {/* Filters */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search creators by name, bio..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              }
            />
          </div>
          <div className="flex flex-wrap gap-3 flex-1 lg:flex-nowrap">
            <Select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              options={[
                { value: "", label: "All Categories" },
                ...demoData.creatorCategories.map(c => ({ value: c.id, label: c.name })),
              ]}
              className="w-48"
            />
            <Select
              value={filters.platform}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
              options={[
                { value: "", label: "All Platforms" },
                ...platforms.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
              ]}
              className="w-40"
            />
            <Input
              placeholder="Min followers"
              value={filters.minFollowers}
              onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: e.target.value }))}
              type="number"
              className="w-36"
            />
            <Select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              options={[
                { value: "followers_desc", label: "Followers: High to Low" },
                { value: "followers_asc", label: "Followers: Low to High" },
                { value: "engagement_desc", label: "Engagement: High to Low" },
                { value: "name_asc", label: "Name: A-Z" },
              ]}
              className="w-52"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-lg transition-colors", viewMode === "grid" ? "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300" : "text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800")}
                aria-label="Grid view"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-lg transition-colors", viewMode === "list" ? "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300" : "text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800")}
                aria-label="List view"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Creators List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} showAvatar={true} lines={2} />)}
        </div>
      ) : creators.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoResultsState
            title="No creators found"
            description="Try adjusting your search or filter criteria."
            action={{ label: "Clear Filters", onClick: () => setFilters({ search: "", category: "", platform: "", minFollowers: "", maxFollowers: "", sort: "followers_desc" }), variant: "outline" }}
          />
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {creators.map((creator) => (
                <CreatorListItem key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Creator Card Component (Grid View)
// ---------------------------------------------------------------------------

function CreatorCard({ creator }: { creator: any }) {
  const primarySocial = creator.socialAccounts[0];
  
  return (
    <Card variant="default" padding="none" className="overflow-hidden hover:shadow-lg transition-shadow">
      {primarySocial && (
        <CardMedia
          aspectRatio="video"
          src={`https://via.placeholder.com/400x225/6366f1/ffffff?text=${encodeURIComponent(creator.display_name)}`}
          alt={creator.display_name}
        />
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              creator.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{creator.display_name}</h3>
            <p className="text-sm text-text-secondary truncate">{creator.bio?.slice(0, 80)}...</p>
          </div>
        </div>
        
        {/* Social Stats */}
        <div className="flex items-center gap-4 pt-2 border-t border-border-subtle">
          {creator.socialAccounts.map((social: any) => (
            <div key={social.id} className="flex items-center gap-1.5 text-sm text-text-tertiary">
              <span className="capitalize font-medium">{social.platform}</span>
              <span className="font-mono tabular-nums">{formatNumber(social.followers_count || 0)}</span>
              {social.is_verified && (
                <svg className="h-3.5 w-3.5 text-brand-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              )}
            </div>
          ))}
        </div>
        
        {/* Avg Engagement */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Avg Engagement</span>
          <span className="font-medium text-text-primary">{creator.avgEngagement.toFixed(1)}%</span>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={`/dashboard/brand/creators/${creator.id}`}>View Profile</a>
          </Button>
          <Button variant="primary" size="sm" className="flex-1">Invite</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Creator List Item Component (List View)
// ---------------------------------------------------------------------------

function CreatorListItem({ creator }: { creator: any }) {
  const primarySocial = creator.socialAccounts[0];
  
  return (
    <Card variant="default" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
        {creator.avatar_url ? (
          <img src={creator.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          creator.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-semibold text-text-primary">{creator.display_name}</h3>
          {creator.verification_status === "verified" && (
            <Badge variant="success" size="xs" dot dotColor="success">Verified</Badge>
          )}
        </div>
        <p className="text-sm text-text-secondary mt-1 truncate">{creator.bio}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-tertiary">
          {creator.socialAccounts.map((social: any) => (
            <span key={social.id} className="flex items-center gap-1.5">
              <span className="capitalize">{social.platform}</span>
              <span className="font-mono tabular-nums">{formatNumber(social.followers_count || 0)}</span>
              {social.is_verified && <svg className="h-3.5 w-3.5 text-brand-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-text-primary">{creator.avgEngagement.toFixed(1)}%</p>
          <p className="text-xs text-text-tertiary">Avg Engagement</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`/dashboard/brand/creators/${creator.id}`}>View</a>
        </Button>
        <Button variant="primary" size="sm">Invite</Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}