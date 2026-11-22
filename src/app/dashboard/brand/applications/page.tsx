"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoDataState } from "@/components/states/Empty";
import { demoData } from "@/services/demo-data";
import { isDemoMode } from "@/context/AuthProvider";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ApplicationStatus } from "@/lib/supabase/types/database";
import { ConfirmationDialog } from "@/components/states/Success";

// ---------------------------------------------------------------------------
// Brand Applications Page Component
// ---------------------------------------------------------------------------

export default function BrandApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState({
    status: "",
    campaign: "",
  });
  const [confirmDialog, setConfirmDialog] = React.useState<{ open: boolean; application: any; action: "accept" | "reject" } | null>(null);

  React.useEffect(() => {
    async function fetchApplications() {
      if (authLoading) return;
      
      setLoading(true);
      try {
        if (isDemoMode) {
          const brandCampaigns = demoData.campaigns.filter(c => c.brand_id === user?.brand_id);
          let filtered = demoData.campaignApplications.filter(a => 
            brandCampaigns.some(c => c.id === a.campaign_id)
          );
          
          // Enrich with campaign and creator data
          const enriched = filtered.map(app => ({
            ...app,
            campaign: brandCampaigns.find(c => c.id === app.campaign_id),
            creator: demoData.creatorProfiles.find(c => c.id === app.creator_profile_id),
            creatorSocial: demoData.creatorSocialAccounts.filter(s => s.creator_profile_id === app.creator_profile_id),
          }));
          
          if (filters.status) {
            enriched.filter(a => a.status === filters.status);
          }
          if (filters.campaign) {
            enriched.filter(a => a.campaign_id === filters.campaign);
          }
          
          // Sort by newest first
          enriched.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
          
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
  }, [authLoading, user?.brand_id, filters]);

  const handleAccept = (application: any) => {
    setConfirmDialog({ open: true, application, action: "accept" });
  };

  const handleReject = (application: any) => {
    setConfirmDialog({ open: true, application, action: "reject" });
  };

  const confirmAction = () => {
    if (!confirmDialog) return;
    
    const { application, action } = confirmDialog;
    setApplications(prev => prev.map(a => 
      a.id === application.id 
        ? { ...a, status: action === "accept" ? "accepted" : "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user?.id }
        : a
    ));
    setConfirmDialog(null);
  };

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-4">
          <SkeletonCard showImage={false} showAvatar={false} lines={3} />
          <SkeletonCard showImage={false} showAvatar={false} lines={3} />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.brand_id) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Applications"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No brand associated</h2>
        </div>
      </DashboardLayout>
    );
  }

  const brandCampaigns = demoData.campaigns.filter(c => c.brand_id === user?.brand_id);

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Applications"
      description="Review and manage creator applications"
      user={user}
    >
      {/* Filters */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: "", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "under_review", label: "Under Review" },
              { value: "accepted", label: "Accepted" },
              { value: "rejected", label: "Rejected" },
              { value: "withdrawn", label: "Withdrawn" },
            ]}
            className="w-48"
          />
          <Select
            value={filters.campaign}
            onChange={(e) => setFilters(prev => ({ ...prev, campaign: e.target.value }))}
            options={[
              { value: "", label: "All Campaigns" },
              ...brandCampaigns.map(c => ({ value: c.id, label: c.title })),
            ]}
            className="w-64"
          />
        </div>
      </Card>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} showImage={false} showAvatar={true} lines={3} />)}
        </div>
      ) : applications.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoDataState
            title="No applications found"
            description={filters.status || filters.campaign ? "Try adjusting your filters." : "No creators have applied to your campaigns yet."}
            illustration="filter"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog(null)}
          title={confirmDialog.action === "accept" ? "Accept Application" : "Reject Application"}
          message={confirmDialog.action === "accept" 
            ? `Are you sure you want to accept ${confirmDialog.application.creator?.display_name}'s application for "${confirmDialog.application.campaign?.title}"?`
            : `Are you sure you want to reject ${confirmDialog.application.creator?.display_name}'s application? This action cannot be undone.`}
          confirmLabel={confirmDialog.action === "accept" ? "Accept" : "Reject"}
          cancelLabel="Cancel"
          onConfirm={confirmAction}
          variant={confirmDialog.action === "accept" ? "success" : "danger"}
        />
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Application Card Component
// ---------------------------------------------------------------------------

function ApplicationCard({ application, onAccept, onReject }: { application: any; onAccept: (app: any) => void; onReject: (app: any) => void }) {
  const primarySocial = application.creatorSocial?.[0];
  const totalFollowers = application.creatorSocial?.reduce((sum: number, s: any) => sum + (s.followers_count || 0), 0) || 0;

  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Creator Info */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg">
              {application.creator?.avatar_url ? (
                <img src={application.creator.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                application.creator?.display_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-primary">{application.creator?.display_name}</h3>
                <StatusBadge status={application.status as any} size="sm" />
              </div>
              <p className="text-sm text-text-secondary">{application.creator?.bio?.slice(0, 100)}...</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-text-tertiary">
                {primarySocial && (
                  <span className="flex items-center gap-1.5">
                    <span className="capitalize">{primarySocial.platform}</span>
                    <span className="font-mono tabular-nums">{formatNumber(totalFollowers)}</span>
                    {primarySocial.is_verified && <svg className="h-3.5 w-3.5 text-brand-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>}
                  </span>
                )}
                <span>Applied {formatDate(application.applied_at)}</span>
              </div>
            </div>
          </div>

          {/* Campaign Info */}
          <div className="flex-1 min-w-0 border-l border-border-subtle pl-4 sm:pl-6">
            <p className="text-xs text-text-tertiary uppercase tracking-wider">Campaign</p>
            <h4 className="font-medium text-text-primary truncate">{application.campaign?.title}</h4>
            <p className="text-sm text-text-secondary mt-1">{application.campaign?.description?.slice(0, 150)}...</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-tertiary">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
                {formatCurrency(application.proposed_rate || 0)} {application.currency}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {application.campaign?.start_date ? formatDate(application.campaign.start_date) : "Not set"}
              </span>
            </div>
          </div>

          {/* Cover Letter & Actions */}
          <div className="flex-1 min-w-0 sm:w-64 flex flex-col items-end">
            {application.cover_letter && (
              <div className="w-full mb-4 p-3 bg-surface-subtle rounded-lg">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Cover Letter</p>
                <p className="text-sm text-text-secondary line-clamp-3">{application.cover_letter}</p>
              </div>
            )}
            
            <div className="w-full flex flex-col gap-2">
              {application.status === "pending" || application.status === "under_review" ? (
                <>
                  <Button variant="success" size="sm" className="w-full" onClick={() => onAccept(application)}>Accept</Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => onReject(application)}>Reject</Button>
                </>
              ) : application.status === "accepted" ? (
                <Button variant="primary" size="sm" className="w-full" asChild>
                  <a href={`/dashboard/brand/collaborations/new?application=${application.id}`}>Create Collaboration</a>
                </Button>
              ) : (
                <div className="w-full text-center text-sm text-text-tertiary">
                  {application.status === "rejected" && application.rejection_reason && (
                    <p className="mb-2">Reason: {application.rejection_reason}</p>
                  )}
                  <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 capitalize">{application.status.replace("_", " ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}