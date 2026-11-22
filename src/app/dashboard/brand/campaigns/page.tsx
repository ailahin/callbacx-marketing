"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoDataState } from "@/components/states/Empty";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CampaignStatus, CampaignVisibility } from "@/lib/supabase/types/database";
import { useCampaigns } from "@/hooks/useQueries";

// ---------------------------------------------------------------------------
// Brand Campaigns Page Component (React Query Version)
// ---------------------------------------------------------------------------

export default function BrandCampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const brandId = user?.brand_id;

  // Fetch campaigns using React Query
  const { data: campaigns, isLoading, error, refetch } = useCampaigns(brandId);
  
  const [filters, setFilters] = React.useState({
    status: "",
    search: "",
    sort: "newest",
  });
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Apply client-side filters
  const filteredCampaigns = React.useMemo(() => {
    let result = campaigns ?? [];
    
    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(search) || 
        c.description?.toLowerCase().includes(search)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "budget_desc": return b.budget_total - a.budget_total;
        case "budget_asc": return a.budget_total - b.budget_total;
        case "name_asc": return a.title.localeCompare(b.title);
        case "name_desc": return b.title.localeCompare(a.title);
        default: return 0;
      }
    });
    
    return result;
  }, [campaigns, filters]);

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
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

  if (!user || !brandId) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Campaigns"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No brand associated</h2>
        </div>
      </DashboardLayout>
    );
  }

  const handleCreateCampaign = async (formData: FormData) => {
    // In demo mode, just add to local state (would use mutation in real implementation)
    const newCampaign = {
      id: `demo-campaign-${Date.now()}`,
      brand_id: user.brand_id,
      title: formData.get("title"),
      description: formData.get("description"),
      brief: formData.get("brief"),
      category_id: formData.get("category_id") || null,
      status: "draft" as CampaignStatus,
      objective: formData.get("objective"),
      target_audience: {},
      budget_total: parseFloat(formData.get("budget_total") as string) || 0,
      budget_currency: "USD",
      compensation_model: formData.get("compensation_model") as CampaignStatus,
      payment_terms: "Net 30",
      start_date: formData.get("start_date") || null,
      end_date: formData.get("end_date") || null,
      application_deadline: formData.get("application_deadline") || null,
      location_requirements: {},
      platform_requirements: (formData.get("platform_requirements") as string)?.split(",").map(s => s.trim()) || [],
      visibility: "public" as CampaignVisibility,
      approval_required: true,
      approved_at: null,
      approved_by: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    
    // Invalidate queries to refetch - in real implementation use useMutation with onMutate/onSuccess
    refetch();
    setShowCreateModal(false);
  };

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Campaigns"
      description="Create and manage your marketing campaigns"
      user={user}
      topBarActions={
        <Button onClick={() => setShowCreateModal(true)} leftIcon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        }>
          Create Campaign
        </Button>
      }
    >
      {/* Filters */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search campaigns..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              }
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: "", label: "All Statuses" },
                { value: "draft", label: "Draft" },
                { value: "pending_approval", label: "Pending Approval" },
                { value: "published", label: "Published" },
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
                { value: "completed", label: "Completed" },
                { value: "archived", label: "Archived" },
                { value: "cancelled", label: "Cancelled" },
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
                { value: "name_asc", label: "Name: A-Z" },
                { value: "name_desc", label: "Name: Z-A" },
              ]}
              className="w-48"
            />
          </div>
        </div>
      </Card>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} showImage={false} showAvatar={false} lines={2} />)}
        </div>
      ) : error ? (
        <Card variant="outlined" padding="lg">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-error-600 mb-2">Failed to load campaigns</h3>
            <p className="text-text-secondary mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoDataState
            title="No campaigns yet"
            description={filters.search || filters.status ? "Try adjusting your filters or search terms." : "Create your first campaign to get started."}
            action={{ label: filters.search || filters.status ? "Clear Filters" : "Create Campaign", onClick: () => setShowCreateModal(true) }}
            illustration="search"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} variant="default" padding="none" className="overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-text-primary truncate">{campaign.title}</h3>
                      <StatusBadge status={campaign.status as any} size="sm" />
                      <Badge variant="secondary" size="sm">{campaign.visibility}</Badge>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-text-secondary mt-1 truncate sm:max-w-2xl">{campaign.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
                        {formatCurrency(campaign.budget_total)} {campaign.budget_currency}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {campaign.start_date ? formatDate(campaign.start_date) : "Not set"} - {campaign.end_date ? formatDate(campaign.end_date) : "Not set"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        {campaign.platform_requirements.join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/dashboard/brand/campaigns/${campaign.id}`}>View</a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/dashboard/brand/campaigns/${campaign.id}/edit`}>Edit</a>
                    </Button>
                    {campaign.status === "draft" && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/dashboard/brand/campaigns/${campaign.id}/publish`}>Publish</a>
                      </Button>
                    )}
                    {campaign.status === "published" && (
                      <Button variant="primary" size="sm" asChild>
                        <a href={`/dashboard/brand/campaigns/${campaign.id}/applications`}>View Applications</a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <CardHeader
              title="Create New Campaign"
              description="Fill in the details to create a new campaign"
              action={
                <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              }
            />
            <form onSubmit={(e) => { e.preventDefault(); handleCreateCampaign(new FormData(e.currentTarget)); }} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Campaign Title *</label>
                  <Input name="title" placeholder="Summer Tech Essentials Campaign" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
                  <textarea name="description" className="w-full px-4 py-3 rounded-lg border border-border-default bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" rows={3} placeholder="Brief description of the campaign..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Campaign Brief</label>
                  <textarea name="brief" className="w-full px-4 py-3 rounded-lg border border-border-default bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" rows={4} placeholder="Detailed brief for creators..."></textarea>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
                    <Select name="category_id" options={[
                      { value: "tech", label: "Technology" },
                      { value: "fashion", label: "Fashion" },
                      { value: "beauty", label: "Beauty" },
                      { value: "lifestyle", label: "Lifestyle" },
                      { value: "food", label: "Food & Beverage" },
                      { value: "travel", label: "Travel" },
                      { value: "fitness", label: "Fitness" },
                      { value: "gaming", label: "Gaming" },
                    ]} placeholder="Select category" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Objective</label>
                    <Select name="objective" options={[
                      { value: "brand_awareness", label: "Brand Awareness" },
                      { value: "conversions", label: "Conversions" },
                      { value: "sales", label: "Sales" },
                      { value: "product_launch", label: "Product Launch" },
                      { value: "engagement", label: "Engagement" },
                    ]} placeholder="Select objective" required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Total Budget *</label>
                    <Input name="budget_total" type="number" placeholder="50000" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Compensation Model</label>
                    <Select name="compensation_model" options={[
                      { value: "flat_fee", label: "Flat Fee" },
                      { value: "per_deliverable", label: "Per Deliverable" },
                      { value: "performance", label: "Performance Based" },
                      { value: "negotiable", label: "Negotiable" },
                    ]} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Platform Requirements</label>
                    <Select name="platform_requirements" multiple options={[
                      { value: "instagram", label: "Instagram" },
                      { value: "tiktok", label: "TikTok" },
                      { value: "youtube", label: "YouTube" },
                      { value: "pinterest", label: "Pinterest" },
                      { value: "twitter", label: "X (Twitter)" },
                    ]} placeholder="Select platforms" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Start Date</label>
                    <Input name="start_date" type="date" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">End Date</label>
                    <Input name="end_date" type="date" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Application Deadline</label>
                    <Input name="application_deadline" type="date" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create Campaign</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}