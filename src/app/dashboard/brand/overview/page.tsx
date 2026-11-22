"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { 
  useCampaigns, 
  useCollaborations, 
  useCampaignApplications,
  useInvoices,
  useConversations,
} from "@/hooks/useQueries";

// ---------------------------------------------------------------------------
// Brand Overview Page Component (React Query Version)
// ---------------------------------------------------------------------------

export default function BrandOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const brandId = user?.brand_id;

  // Fetch all data in parallel using React Query
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns(brandId);
  const { data: collaborations, isLoading: collabsLoading } = useCollaborations(brandId);
  const { data: applications, isLoading: appsLoading } = useCampaignApplications(undefined, undefined);
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(brandId);
  const { data: conversations, isLoading: convosLoading } = useConversations(brandId);

  const isLoading = authLoading || campaignsLoading || collabsLoading || appsLoading || invoicesLoading || convosLoading;

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !brandId) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Brand Dashboard"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No brand associated</h2>
          <p className="text-text-secondary">Please contact support to set up your brand account.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Brand Overview"
        user={user}
      >
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </DashboardLayout>
    );
  }

  // Compute stats from fetched data
  const campaignsData = campaigns ?? [];
  const collaborationsData = collaborations ?? [];
  const applicationsData = applications ?? [];
  const invoicesData = invoices ?? [];
  const conversationsData = conversations ?? [];

  // Filter applications for this brand's campaigns
  const brandCampaignIds = new Set(campaignsData.map(c => c.id));
  const brandApplications = applicationsData.filter(a => brandCampaignIds.has(a.campaign_id));

  const stats = {
    campaigns: campaignsData.length,
    activeCollabs: collaborationsData.filter(c => c.status === "active").length,
    pendingApplications: brandApplications.filter(a => a.status === "pending" || a.status === "under_review").length,
    totalSpend: collaborationsData.reduce((sum, c) => sum + (c.agreed_fee || 0), 0),
  };

  const recentCampaigns = campaignsData.slice(0, 5);
  const recentActivity = [
    { type: "campaign_created", title: "Summer Tech Essentials Campaign", time: "2 hours ago", campaignId: "demo-campaign-1" },
    { type: "application_received", title: "New application from Alex Creator", time: "4 hours ago", applicationId: "demo-app-1" },
    { type: "collaboration_started", title: "Wireless Earbuds Launch started", time: "1 day ago", collaborationId: "demo-collab-2" },
    { type: "invoice_paid", title: "Invoice INV-2024-002 paid", time: "2 days ago", invoiceId: "demo-inv-2" },
    { type: "campaign_completed", title: "Power Bank Campaign completed", time: "1 week ago", campaignId: "demo-campaign-5" },
  ];

  const statCards = [
    {
      label: "Total Campaigns",
      value: stats.campaigns,
      change: "+2 this month",
      changeType: "increase" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: "Active Collaborations",
      value: stats.activeCollabs,
      change: "+1 this week",
      changeType: "increase" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications,
      change: "3 new today",
      changeType: "neutral" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Total Spend",
      value: formatCurrency(stats.totalSpend),
      change: "+12% vs last month",
      changeType: "increase" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Brand Overview"
      description="Track your campaign performance and collaboration metrics"
      user={user}
    >
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            value={stat.value}
            label={stat.label}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Campaigns */}
        <Card variant="default" padding="none" className="lg:col-span-2">
          <CardHeader
            title="Recent Campaigns"
            description="Your latest campaigns and their performance"
            action={
              <Button variant="ghost" size="sm" asChild>
                <a href="/dashboard/brand/campaigns">View All</a>
              </Button>
            }
          />
          <CardContent className="p-0">
            {recentCampaigns.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-text-secondary mb-4">No campaigns yet</p>
                <Button asChild>
                  <a href="/dashboard/brand/campaigns/new">Create Your First Campaign</a>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-subtle transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-text-primary truncate">{campaign.title}</h3>
                        <StatusBadge status={campaign.status as any} size="sm" />
                      </div>
                      <p className="text-sm text-text-secondary truncate mt-1">{campaign.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-text-tertiary">
                        <span>{formatCurrency(campaign.budget_total)} {campaign.budget_currency}</span>
                        <span>{new Date(campaign.start_date || campaign.created_at).toLocaleDateString()} - {new Date(campaign.end_date || campaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/dashboard/brand/campaigns/${campaign.id}`}>View</a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card variant="default" padding="none">
          <CardHeader
            title="Recent Activity"
            description="Latest updates across your campaigns"
          />
          <CardContent className="p-0">
            <div className="divide-y divide-border-subtle">
              {recentActivity.map((activity, index) => (
                <div key={index} className="p-4 flex items-start gap-3 hover:bg-surface-subtle transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{activity.title}</p>
                    <p className="text-xs text-text-tertiary">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          } asChild>
            <a href="/dashboard/brand/campaigns/new">Create Campaign</a>
          </Button>
          <Button variant="outline" leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          } asChild>
            <a href="/dashboard/brand/creators">Discover Creators</a>
          </Button>
          <Button variant="outline" leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          } asChild>
            <a href="/dashboard/brand/applications">Review Applications</a>
          </Button>
          <Button variant="outline" leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h4M8 12l2-2m0 0l2 2m-2-2v8m-6 0h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          } asChild>
            <a href="/dashboard/brand/conversations">Messages</a>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}