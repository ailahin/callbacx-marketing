"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoResultsState } from "@/components/states/Empty";
import { demoData, isDemoMode } from "@/services/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CollaborationStatus } from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Creator Collaborations Page Component
// ---------------------------------------------------------------------------

export default function CreatorCollaborationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [collaborations, setCollaborations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState({
    search: "",
    status: "",
    sort: "newest",
  });
  const [activeTab, setActiveTab] = React.useState<"active" | "completed" | "all">("active");

  React.useEffect(() => {
    async function fetchCollaborations() {
      if (authLoading) return;

      setLoading(true);
      try {
        if (isDemoMode) {
          const creatorProfile = demoData.creatorProfile;
          let filtered = demoData.collaborations.filter(c => c.creator_profile_id === creatorProfile.id);

          if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(c => {
              const campaign = demoData.campaigns.find(camp => camp.id === c.campaign_id);
              return campaign?.title.toLowerCase().includes(search) ||
                campaign?.description?.toLowerCase().includes(search);
            });
          }
          if (filters.status) {
            filtered = filtered.filter(c => c.status === filters.status);
          }

          // Enrich with campaign data
          const enriched = filtered.map(collab => {
            const campaign = demoData.campaigns.find(c => c.id === collab.campaign_id);
            const brand = demoData.brand;
            return {
              ...collab,
              campaign: campaign ? {
                ...campaign,
                brand: { name: brand.name },
              } : null,
            };
          });

          // Sort
          enriched.sort((a, b) => {
            switch (filters.sort) {
              case "newest": return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
              case "oldest": return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
              case "fee_desc": return b.agreed_fee - a.agreed_fee;
              case "fee_asc": return a.agreed_fee - b.agreed_fee;
              default: return 0;
            }
          });

          setCollaborations(enriched);
        } else {
          setCollaborations([]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchCollaborations();
  }, [authLoading, user?.id, filters]);

  // Filter by tab
  const tabFilteredCollaborations = React.useMemo(() => {
    switch (activeTab) {
      case "active":
        return collaborations.filter(c => c.status === "active" || c.status === "in_progress" || c.status === "pending_deliverables");
      case "completed":
        return collaborations.filter(c => c.status === "completed");
      default:
        return collaborations;
    }
  }, [collaborations, activeTab]);

  const stats = {
    total: collaborations.length,
    active: collaborations.filter(c => c.status === "active" || c.status === "in_progress" || c.status === "pending_deliverables").length,
    completed: collaborations.filter(c => c.status === "completed").length,
    totalEarnings: collaborations.reduce((sum, c) => sum + c.agreed_fee, 0),
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
        title="My Collaborations"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Complete your creator profile first</h2>
          <p className="text-text-secondary mb-4">You need a creator profile to view and manage collaborations.</p>
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
      title="My Collaborations"
      description="Manage your active and completed brand partnerships"
      user={user}
    >
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Partnerships</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Active</p>
              <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Completed</p>
              <p className="text-2xl font-bold text-text-primary">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Earnings</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalEarnings)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6" role="tablist">
        {[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "completed", label: "Completed" },
        ].map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              activeTab === tab.id
                ? "bg-brand-600 text-white"
                : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
          >
            {tab.label}
            {tab.id === "active" && stats.active > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 dark:bg-neutral-800 rounded-full">{stats.active}</span>
            )}
            {tab.id === "completed" && stats.completed > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 dark:bg-neutral-800 rounded-full">{stats.completed}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search collaborations..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              }
            />
          </div>
          <div className="flex flex-wrap gap-3 flex-1 lg:flex-nowrap">
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: "", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "in_progress", label: "In Progress" },
                { value: "pending_deliverables", label: "Pending Deliverables" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              className="w-48"
            />
            <Select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "fee_desc", label: "Fee: High to Low" },
                { value: "fee_asc", label: "Fee: Low to High" },
              ]}
              className="w-48"
            />
          </div>
        </div>
      </Card>

      {/* Collaborations */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} showAvatar={false} lines={2} />)}
        </div>
      ) : tabFilteredCollaborations.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoResultsState
            title={filters.search || filters.status ? "No collaborations found" : activeTab === "active" ? "No active collaborations" : activeTab === "completed" ? "No completed collaborations" : "No collaborations yet"}
            description={filters.search || filters.status
              ? "Try adjusting your search or filter criteria."
              : activeTab === "active"
                ? "When brands accept your applications, collaborations will appear here."
                : activeTab === "completed"
                  ? "Completed collaborations will show up here."
                  : "Apply to campaigns to start building partnerships."}
            action={filters.search || filters.status ? {
              label: "Clear Filters",
              onClick: () => setFilters({ search: "", status: "", sort: "newest" }),
              variant: "outline"
            } : activeTab === "all" ? {
              label: "Browse Campaigns",
              onClick: () => window.location.href = "/dashboard/creator/campaigns",
              variant: "primary"
            } : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tabFilteredCollaborations.map((collab) => (
            <CollaborationCard key={collab.id} collab={collab} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Collaboration Card Component
// ---------------------------------------------------------------------------

function CollaborationCard({ collab }: { collab: any }) {
  const campaign = collab.campaign;

  return (
    <Card variant="default" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-16 h-16 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
        {campaign?.title?.charAt(0) || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-semibold text-text-primary truncate">{campaign?.title || "Unknown Campaign"}</h3>
          <StatusBadge status={collab.status as any} size="sm" />
        </div>
        <p className="text-sm text-text-secondary truncate">{campaign?.brand?.name}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-tertiary">
          <span className="flex items-center gap-1.5 font-medium text-text-primary">
            {formatCurrency(collab.agreed_fee)} {collab.currency}
          </span>
          <span className="flex items-center gap-1.5">
            Started: {formatDate(collab.started_at)}
          </span>
          {collab.completed_at && (
            <span className="flex items-center gap-1.5">
              Completed: {formatDate(collab.completed_at)}
            </span>
          )}
          {campaign && campaign.platform_requirements && (
            <span className="flex items-center gap-1.5">
              {campaign.platform_requirements.map((p: string) => (
                <Badge key={p} variant="secondary" size="xs" dot dotColor="primary">{p.charAt(0).toUpperCase()}</Badge>
              ))}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
        {collab.status === "active" && (
          <Button variant="primary" className="w-full sm:w-auto" asChild>
            <a href={`/dashboard/creator/conversations?collab=${collab.id}`}>View Details</a>
          </Button>
        )}
        {collab.status === "in_progress" && (
          <Button variant="primary" className="w-full sm:w-auto" asChild>
            <a href={`/dashboard/creator/conversations?collab=${collab.id}`}>Continue Work</a>
          </Button>
        )}
        {collab.status === "pending_deliverables" && (
          <Button variant="warning" className="w-full sm:w-auto" asChild>
            <a href={`/dashboard/creator/conversations?collab=${collab.id}`}>Submit Deliverables</a>
          </Button>
        )}
        {collab.status === "completed" && (
          <Button variant="secondary" className="w-full sm:w-auto" asChild>
            <a href={`/dashboard/creator/conversations?collab=${collab.id}`}>View History</a>
          </Button>
        )}
      </div>
    </Card>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}