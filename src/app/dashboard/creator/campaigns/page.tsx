"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter, CardMedia } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoResultsState } from "@/components/states/Empty";
import { demoData } from "@/services/demo-data";
import { isDemoMode } from "@/context/AuthProvider";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { CampaignStatus, CompensationModel } from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Creator Campaigns Page Component (Browse)
// ---------------------------------------------------------------------------

export default function CreatorCampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState({
    search: "",
    category: "",
    platform: "",
    compensation: "",
    sort: "newest",
  });
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [appliedCampaigns, setAppliedCampaigns] = React.useState<string[]>([]);

  React.useEffect(() => {
    async function fetchCampaigns() {
      if (authLoading) return;
      
      setLoading(true);
      try {
        if (isDemoMode) {
          const creatorProfile = demoData.creatorProfiles.find(c => c.profile_id === user?.id);
          const creatorApplications = demoData.campaignApplications.filter(a => a.creator_profile_id === creatorProfile?.id);
          setAppliedCampaigns(new Set(creatorApplications.map(a => a.campaign_id)));
          
          // Show published and active campaigns
          let filtered = demoData.campaigns.filter(c => 
            (c.status === "published" || c.status === "active") && 
            c.visibility === "public" &&
            c.is_active
          );
          
          if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(c => 
              c.title.toLowerCase().includes(search) || 
              c.description?.toLowerCase().includes(search) ||
              c.brief?.toLowerCase().includes(search)
            );
          }
          if (filters.category) {
            filtered = filtered.filter(c => c.category_id === filters.category);
          }
          if (filters.platform) {
            filtered = filtered.filter(c => c.platform_requirements.includes(filters.platform));
          }
          if (filters.compensation) {
            filtered = filtered.filter(c => c.compensation_model === filters.compensation);
          }
          
          // Enrich with brand info
          const enriched = filtered.map(campaign => ({
            ...campaign,
            brand: demoData.brandCategories.find(bc => bc.id === campaign.brand_id) ? { name: "Acme Corporation" } : { name: "Unknown Brand" },
            applied: appliedCampaigns.has(campaign.id),
            applicationsCount: demoData.campaignApplications.filter(a => a.campaign_id === campaign.id).length,
          }));
          
          // Sort
          enriched.sort((a, b) => {
            switch (filters.sort) {
              case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              case "budget_desc": return b.budget_total - a.budget_total;
              case "budget_asc": return a.budget_total - b.budget_total;
              case "deadline_asc": return new Date(a.application_deadline || "").getTime() - new Date(b.application_deadline || "").getTime();
              default: return 0;
            }
          });
          
          setCampaigns(enriched);
        } else {
          setCampaigns([]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, [authLoading, user?.id, filters]);

  const handleApply = (campaignId: string) => {
    setAppliedCampaigns(prev => new Set([...prev, campaignId]));
    // In production, would call API to create application
    alert("Application submitted! The brand will review your profile.");
  };

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.creator_profile_id) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Browse Campaigns"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Complete your creator profile first</h2>
          <p className="text-text-secondary mb-4">You need a creator profile to browse and apply to campaigns.</p>
          <Button asChild>
            <a href="/dashboard/creator/profile">Create Profile</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navSections={CREATOR_NAV_SECTIONS}
      title="Browse Campaigns"
      description="Discover and apply to campaigns from top brands"
      user={user}
    >
      {/* Filters */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search campaigns..."
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
                ...demoData.brandCategories.map(c => ({ value: c.id, label: c.name })),
              ]}
              className="w-48"
            />
            <Select
              value={filters.platform}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
              options={[
                { value: "", label: "All Platforms" },
                { value: "instagram", label: "Instagram" },
                { value: "tiktok", label: "TikTok" },
                { value: "youtube", label: "YouTube" },
                { value: "pinterest", label: "Pinterest" },
              ]}
              className="w-40"
            />
            <Select
              value={filters.compensation}
              onChange={(e) => setFilters(prev => ({ ...prev, compensation: e.target.value }))}
              options={[
                { value: "", label: "All Types" },
                { value: "flat_fee", label: "Flat Fee" },
                { value: "per_deliverable", label: "Per Deliverable" },
                { value: "performance", label: "Performance" },
                { value: "negotiable", label: "Negotiable" },
              ]}
              className="w-40"
            />
            <Select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "budget_desc", label: "Budget: High to Low" },
                { value: "budget_asc", label: "Budget: Low to High" },
                { value: "deadline_asc", label: "Deadline Soonest" },
              ]}
              className="w-48"
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

      {/* Campaigns */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} showAvatar={false} lines={3} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoResultsState
            title="No campaigns found"
            description="Try adjusting your search or filter criteria."
            action={{ label: "Clear Filters", onClick: () => setFilters({ search: "", category: "", platform: "", compensation: "", sort: "newest" }), variant: "outline" }}
          />
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} onApply={handleApply} applied={campaign.applied} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <CampaignListItem key={campaign.id} campaign={campaign} onApply={handleApply} applied={campaign.applied} />
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Campaign Card Component (Grid View)
// ---------------------------------------------------------------------------

function CampaignCard({ campaign, onApply, applied }: { campaign: any; onApply: (id: string) => void; applied: boolean }) {
  const daysLeft = campaign.application_deadline 
    ? Math.ceil((new Date(campaign.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card variant="default" padding="none" className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardMedia
        aspectRatio="video"
        src={`https://via.placeholder.com/400x225/6366f1/ffffff?text=${encodeURIComponent(campaign.title)}`}
        alt={campaign.title}
      />
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{campaign.title}</h3>
            <p className="text-sm text-text-secondary truncate">{campaign.brand?.name}</p>
          </div>
          <StatusBadge status={campaign.status as any} size="xs" />
        </div>
        
        <p className="text-sm text-text-secondary line-clamp-2">{campaign.description || campaign.brief}</p>
        
        <div className="flex flex-wrap gap-2">
          {campaign.platform_requirements.map((platform: string) => (
            <Badge key={platform} variant="secondary" size="xs" dot dotColor="primary">
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle mt-auto">
          <div className="flex items-center gap-4 text-sm text-text-tertiary">
            <span className="flex items-center gap-1.5 font-medium text-text-primary">
              {formatCurrency(campaign.budget_total)} {campaign.budget_currency}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
              {campaign.compensation_model.replace("_", " ")}
            </span>
          </div>
          {daysLeft !== null && daysLeft > 0 && (
            <Badge variant={daysLeft <= 7 ? "warning" : "default"} size="xs">
              {daysLeft}d left
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter divided className="p-4">
        {applied ? (
          <Button variant="secondary" className="w-full" disabled>Applied</Button>
        ) : (
          <Button variant="primary" className="w-full" onClick={() => onApply(campaign.id)}>Apply Now</Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Campaign List Item Component (List View)
// ---------------------------------------------------------------------------

function CampaignListItem({ campaign, onApply, applied }: { campaign: any; onApply: (id: string) => void; applied: boolean }) {
  const daysLeft = campaign.application_deadline 
    ? Math.ceil((new Date(campaign.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card variant="default" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-20 h-20 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
        {campaign.title.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-text-primary truncate">{campaign.title}</h3>
          <StatusBadge status={campaign.status as any} size="sm" />
          <Badge variant="secondary" size="sm">{campaign.brand?.name}</Badge>
        </div>
        <p className="text-sm text-text-secondary truncate mt-1">{campaign.description || campaign.brief}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-tertiary">
          <span className="flex items-center gap-1.5 font-medium text-text-primary">
            {formatCurrency(campaign.budget_total)} {campaign.budget_currency}
          </span>
          <span className="flex items-center gap-1.5">
            {campaign.platform_requirements.map((p: string) => (
              <Badge key={p} variant="secondary" size="xs" dot dotColor="primary">{p.charAt(0).toUpperCase()}</Badge>
            ))}
          </span>
          {daysLeft !== null && (
            <Badge variant={daysLeft <= 7 ? "warning" : "default"} size="sm">
              {daysLeft}d left
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
        {applied ? (
          <Button variant="secondary" className="w-full sm:w-auto" disabled>Applied</Button>
        ) : (
          <Button variant="primary" className="w-full sm:w-auto" onClick={() => onApply(campaign.id)}>Apply</Button>
        )}
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