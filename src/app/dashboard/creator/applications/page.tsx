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
import { ApplicationStatus } from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Creator Applications Page Component
// ---------------------------------------------------------------------------

export default function CreatorApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState({
    search: "",
    status: "",
    sort: "newest",
  });
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");

  React.useEffect(() => {
    async function fetchApplications() {
      if (authLoading) return;

      setLoading(true);
      try {
        if (isDemoMode) {
          const creatorProfile = demoData.creatorProfile;
          let filtered = demoData.campaignApplications.filter(a => a.creator_profile_id === creatorProfile.id);

          if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(a => {
              const campaign = demoData.campaigns.find(c => c.id === a.campaign_id);
              return campaign?.title.toLowerCase().includes(search) ||
                campaign?.description?.toLowerCase().includes(search) ||
                a.cover_letter?.toLowerCase().includes(search);
            });
          }
          if (filters.status) {
            filtered = filtered.filter(a => a.status === filters.status);
          }

          // Enrich with campaign data
          const enriched = filtered.map(app => {
            const campaign = demoData.campaigns.find(c => c.id === app.campaign_id);
            const brand = demoData.brand;
            return {
              ...app,
              campaign: campaign ? {
                ...campaign,
                brand: { name: brand.name },
              } : null,
            };
          });

          // Sort
          enriched.sort((a, b) => {
            switch (filters.sort) {
              case "newest": return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
              case "oldest": return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
              case "status": return a.status.localeCompare(b.status);
              default: return 0;
            }
          });

          setApplications(enriched);
        } else {
          setApplications([]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [authLoading, user?.id, filters]);

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "accepted": return "success";
      case "rejected": return "error";
      case "under_review": return "warning";
      case "pending": return "info";
      default: return "default";
    }
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
        title="My Applications"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Complete your creator profile first</h2>
          <p className="text-text-secondary mb-4">You need a creator profile to view and manage applications.</p>
          <Button asChild>
            <a href="/dashboard/creator/profile">Create Profile</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    under_review: applications.filter(a => a.status === "under_review").length,
    accepted: applications.filter(a => a.status === "accepted").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <DashboardLayout
      navSections={CREATOR_NAV_SECTIONS}
      title="My Applications"
      description="Track and manage your campaign applications"
      user={user}
    >
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Applications</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Pending</p>
              <p className="text-2xl font-bold text-text-primary">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 dark:text-warning-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Under Review</p>
              <p className="text-2xl font-bold text-text-primary">{stats.under_review}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-info-100 dark:bg-info-900/30 flex items-center justify-center text-info-600 dark:text-info-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Accepted</p>
              <p className="text-2xl font-bold text-text-primary">{stats.accepted}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Rejected</p>
              <p className="text-2xl font-bold text-text-primary">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error-100 dark:bg-error-900/30 flex items-center justify-center text-error-600 dark:text-error-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search applications..."
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
                { value: "pending", label: "Pending" },
                { value: "under_review", label: "Under Review" },
                { value: "accepted", label: "Accepted" },
                { value: "rejected", label: "Rejected" },
              ]}
              className="w-48"
            />
            <Select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "status", label: "By Status" },
              ]}
              className="w-48"
            />
          </div>
        </div>
      </Card>

      {/* Applications */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} showAvatar={false} lines={2} />)}
        </div>
      ) : applications.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoResultsState
            title={filters.search || filters.status ? "No applications found" : "No applications yet"}
            description={filters.search || filters.status
              ? "Try adjusting your search or filter criteria."
              : "Start browsing campaigns and apply to opportunities that match your style."}
            action={filters.search || filters.status ? {
              label: "Clear Filters",
              onClick: () => setFilters({ search: "", status: "", sort: "newest" }),
              variant: "outline"
            } : {
              label: "Browse Campaigns",
              onClick: () => window.location.href = "/dashboard/creator/campaigns",
              variant: "primary"
            }}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Application Card Component
// ---------------------------------------------------------------------------

function ApplicationCard({ application }: { application: any }) {
  const campaign = application.campaign;
  const statusColor = getStatusColor(application.status);

  return (
    <Card variant="default" padding="md" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-16 h-16 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg flex-shrink-0">
        {campaign?.title?.charAt(0) || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-semibold text-text-primary truncate">{campaign?.title || "Unknown Campaign"}</h3>
          <StatusBadge status={application.status as any} size="sm" />
        </div>
        <p className="text-sm text-text-secondary truncate">{campaign?.brand?.name}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-tertiary">
          <span className="flex items-center gap-1.5">
            Applied: {formatDate(application.applied_at)}
          </span>
          {application.reviewed_at && (
            <span className="flex items-center gap-1.5">
              Reviewed: {formatDate(application.reviewed_at)}
            </span>
          )}
          {application.proposed_rate && (
            <span className="flex items-center gap-1.5 font-medium text-text-primary">
              Proposed: {formatCurrency(application.proposed_rate)} {application.currency}
            </span>
          )}
          {campaign && (
            <span className="flex items-center gap-1.5">
              Budget: {formatCurrency(campaign.budget_total)} {campaign.budget_currency}
            </span>
          )}
        </div>
        {application.rejection_reason && (
          <div className="mt-2 p-2 rounded bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 text-sm">
            Rejection reason: {application.rejection_reason}
          </div>
        )}
        {application.cover_letter && (
          <div className="mt-2 p-2 rounded bg-neutral-100 dark:bg-neutral-800 text-text-secondary text-sm">
            "{application.cover_letter}"
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
        {application.status === "accepted" && (
          <Button variant="secondary" className="w-full sm:w-auto" disabled>Accepted</Button>
        )}
        {application.status === "pending" && (
          <Button variant="secondary" className="w-full sm:w-auto" disabled>Pending Review</Button>
        )}
        {application.status === "under_review" && (
          <Button variant="secondary" className="w-full sm:w-auto" disabled>Under Review</Button>
        )}
        {application.status === "rejected" && (
          <Button variant="ghost" className="w-full sm:w-auto text-error-600 dark:text-error-400">Declined</Button>
        )}
      </div>
    </Card>
  );
}

function getStatusColor(status: ApplicationStatus) {
  switch (status) {
    case "accepted": return "success";
    case "rejected": return "error";
    case "under_review": return "warning";
    case "pending": return "info";
    default: return "default";
  }
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}