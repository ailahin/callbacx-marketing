"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoDataState } from "@/components/states/Empty";
import { demoData } from "@/services/demo-data";
import { isDemoMode } from "@/context/AuthProvider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CollaborationStatus } from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Brand Collaborations Page Component
// ---------------------------------------------------------------------------

export default function BrandCollaborationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [collaborations, setCollaborations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState({
    status: "",
  });
  const [activeTab, setActiveTab] = React.useState<"active" | "completed" | "all">("active");

  React.useEffect(() => {
    async function fetchCollaborations() {
      if (authLoading) return;
      
      setLoading(true);
      try {
        if (isDemoMode) {
          let filtered = demoData.collaborations.filter(c => c.brand_id === user?.brand_id);
          
          // Enrich with campaign and creator data
          const enriched = filtered.map(collab => ({
            ...collab,
            campaign: demoData.campaigns.find(c => c.id === collab.campaign_id),
            creator: demoData.creatorProfiles.find(c => c.id === collab.creator_profile_id),
            deliverables: demoData.campaigns.find(c => c.id === collab.campaign_id) ? [] : [], // Would fetch from API
          }));
          
          if (filters.status) {
            enriched.filter(c => c.status === filters.status);
          }
          
          // Sort by newest first
          enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
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
  }, [authLoading, user?.brand_id, filters]);

  const activeCollabs = collaborations.filter(c => c.status === "active" || c.status === "negotiating");
  const completedCollabs = collaborations.filter(c => c.status === "completed");
  const totalSpend = collaborations.reduce((sum, c) => sum + (c.agreed_fee || 0), 0);

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard showImage={false} showAvatar={false} lines={3} />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.brand_id) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Collaborations"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No brand associated</h2>
        </div>
      </DashboardLayout>
    );
  }

  const getFilteredCollabs = () => {
    switch (activeTab) {
      case "active": return activeCollabs;
      case "completed": return completedCollabs;
      default: return collaborations;
    }
  };

  const filteredCollabs = getFilteredCollabs();

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Collaborations"
      description="Manage your active and completed collaborations"
      user={user}
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          value={activeCollabs.length}
          label="Active Collaborations"
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
        />
        <StatCard
          value={completedCollabs.length}
          label="Completed"
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          value={formatCurrency(totalSpend)}
          label="Total Spend"
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-subtle">
        {[
          { id: "active", label: `Active (${activeCollabs.length})` },
          { id: "completed", label: `Completed (${completedCollabs.length})` },
          { id: "all", label: `All (${collaborations.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Collaborations List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} showImage={false} showAvatar={true} lines={3} />)}
        </div>
      ) : filteredCollabs.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoDataState
            title={activeTab === "active" ? "No active collaborations" : activeTab === "completed" ? "No completed collaborations" : "No collaborations yet"}
            description={activeTab === "active" 
              ? "Accepted applications will appear here as active collaborations."
              : activeTab === "completed"
              ? "Completed collaborations will appear here."
              : "Start by accepting creator applications to begin collaborations."}
            illustration="connection"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCollabs.map((collab) => (
            <CollaborationCard key={collab.id} collaboration={collab} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Collaboration Card Component
// ---------------------------------------------------------------------------

function CollaborationCard({ collaboration }: { collaboration: any }) {
  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Creator Avatar & Info */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg">
              {collaboration.creator?.avatar_url ? (
                <img src={collaboration.creator.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                collaboration.creator?.display_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-text-primary truncate">{collaboration.creator?.display_name}</h3>
                <StatusBadge status={collaboration.status as any} size="sm" />
              </div>
              <p className="text-sm text-text-secondary truncate">{collaboration.campaign?.title}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-text-tertiary">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
                  {formatCurrency(collaboration.agreed_fee || 0)} {collaboration.currency}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Started {formatDate(collaboration.started_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 sm:flex-shrink-0">
            <div className="flex-1 w-full sm:w-48">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-text-secondary">Progress</span>
                <span className="font-medium text-text-primary">{collaboration.status === "completed" ? 100 : collaboration.status === "active" ? 65 : 20}%</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${collaboration.status === "completed" ? 100 : collaboration.status === "active" ? 65 : 20}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="sm" asChild>
                <a href={`/dashboard/brand/collaborations/${collaboration.id}`}>View Details</a>
              </Button>
              {collaboration.status === "active" && (
                <Button variant="primary" size="sm" asChild>
                  <a href={`/dashboard/brand/collaborations/${collaboration.id}/deliverables`}>Manage Deliverables</a>
                </Button>
              )}
              {collaboration.status === "active" && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/dashboard/brand/conversations?collaboration=${collaboration.id}`}>Message</a>
                </Button>
              )}
            </div>
          </div>
        </div>
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