"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, StatCard, ProfileCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoDataState } from "@/components/states/Empty";
import { demoData } from "@/services/demo-data";
import { isDemoMode } from "@/context/AuthProvider";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Creator Overview Page Component
// ---------------------------------------------------------------------------

export default function CreatorOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<{
    stats: { activeCollabs: number; pendingApplications: number; totalEarnings: number; avgEngagement: number };
    recentActivity: any[];
    upcomingDeliverables: any[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      if (authLoading) return;
      
      setLoading(true);
      try {
        if (isDemoMode) {
          const creatorProfile = demoData.creatorProfiles.find(c => c.profile_id === user?.id);
          const creatorCollabs = demoData.collaborations.filter(c => c.creator_profile_id === creatorProfile?.id);
          const creatorApplications = demoData.campaignApplications.filter(a => a.creator_profile_id === creatorProfile?.id);
          const creatorPayouts = demoData.creatorPayouts.filter(p => p.creator_profile_id === creatorProfile?.id);
          const creatorAnalytics = demoData.creatorAnalytics.filter(a => a.creator_profile_id === creatorProfile?.id);
          
          const totalEarnings = creatorPayouts.reduce((sum, p) => sum + p.amount, 0);
          const avgEngagement = creatorAnalytics.length > 0 
            ? creatorAnalytics.reduce((sum, a) => sum + a.engagement, 0) / creatorAnalytics.length 
            : 0;
          
          setData({
            stats: {
              activeCollabs: creatorCollabs.filter(c => c.status === "active").length,
              pendingApplications: creatorApplications.filter(a => a.status === "pending" || a.status === "under_review").length,
              totalEarnings,
              avgEngagement: Math.round(avgEngagement * 10) / 10,
            },
            recentActivity: [
              { type: "application_accepted", title: "Application accepted for Summer Tech Essentials", time: "2 hours ago", campaignId: "demo-campaign-1" },
              { type: "deliverable_due", title: "Instagram Reel due tomorrow", time: "1 day ago", collaborationId: "demo-collab-1" },
              { type: "payment_received", title: "Received $2,425 for Wireless Earbuds campaign", time: "3 days ago", payoutId: "demo-payout-1" },
              { type: "new_campaign_match", title: "New campaign match: Back to School Laptops", time: "1 week ago", campaignId: "demo-campaign-2" },
              { type: "deliverable_approved", title: "YouTube video approved", time: "2 weeks ago", collaborationId: "demo-collab-2" },
            ],
            upcomingDeliverables: [
              { title: "Instagram Reel - Summer Tech", due: "2024-06-15", campaign: "Summer Tech Essentials", status: "pending" },
              { title: "TikTok Video - Product Demo", due: "2024-06-20", campaign: "Summer Tech Essentials", status: "pending" },
              { title: "YouTube Review - Earbuds", due: "2024-06-25", campaign: "Wireless Earbuds Launch", status: "submitted" },
            ],
          });
        } else {
          setData({
            stats: { activeCollabs: 0, pendingApplications: 0, totalEarnings: 0, avgEngagement: 0 },
            recentActivity: [],
            upcomingDeliverables: [],
          });
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, user?.id]);

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.creator_profile_id) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Creator Dashboard"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No creator profile</h2>
          <p className="text-text-secondary">Please complete your creator profile to access the dashboard.</p>
          <Button asChild className="mt-4">
            <a href="/dashboard/creator/profile/edit">Complete Profile</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Error"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-error-600 mb-2">Failed to load dashboard</h2>
          <p className="text-text-secondary mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || !data) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Creator Overview"
        user={user}
      >
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </DashboardLayout>
    );
  }

  const { stats, recentActivity, upcomingDeliverables } = data;
  const creatorProfile = demoData.creatorProfiles.find(c => c.profile_id === user?.id);

  const statCards = [
    {
      label: "Active Collaborations",
      value: stats.activeCollabs,
      change: "+1 this month",
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
      change: "2 new this week",
      changeType: "neutral" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Total Earnings",
      value: formatCurrency(stats.totalEarnings),
      change: "+15% vs last month",
      changeType: "increase" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" />
        </svg>
      ),
    },
    {
      label: "Avg Engagement",
      value: `${stats.avgEngagement}%`,
      change: "+0.5% vs last month",
      changeType: "increase" as const,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout
      navSections={CREATOR_NAV_SECTIONS}
      title="Creator Overview"
      description="Track your collaborations, applications, and earnings"
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
        {/* Profile Summary */}
        <Card variant="default" padding="none" className="lg:col-span-2">
          <CardContent className="p-0">
            <ProfileCard
              name={creatorProfile?.display_name || user?.full_name || "Creator"}
              role={creatorProfile?.headline || "Content Creator"}
              email={user?.email}
              bio={creatorProfile?.bio}
              avatarFallback={creatorProfile?.display_name || user?.full_name || "CR"}
              metadata={[
                { label: "Active Collabs", value: stats.activeCollabs.toString() },
                { label: "Pending Apps", value: stats.pendingApplications.toString() },
                { label: "Total Earnings", value: formatCurrency(stats.totalEarnings) },
                { label: "Avg Engagement", value: `${stats.avgEngagement}%` },
              ]}
              actions={
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1" asChild>
                    <a href="/dashboard/creator/profile/edit">Edit Profile</a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href="/dashboard/creator/portfolio">View Portfolio</a>
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Upcoming Deliverables */}
        <Card variant="default" padding="none">
          <CardHeader
            title="Upcoming Deliverables"
            description="Your upcoming deadlines"
          />
          <CardContent className="p-0">
            {upcomingDeliverables.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-text-secondary mb-4">No upcoming deliverables</p>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/dashboard/creator/collaborations">View Collaborations</a>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {upcomingDeliverables.map((deliverable, index) => (
                  <div key={index} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-subtle transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-text-primary truncate">{deliverable.title}</h4>
                        <StatusBadge status={deliverable.status as any} size="xs" />
                      </div>
                      <p className="text-sm text-text-secondary truncate mt-0.5">{deliverable.campaign}</p>
                      <p className="text-xs text-text-tertiary mt-1">Due {new Date(deliverable.due).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/dashboard/creator/collaborations/${deliverable.campaignId || "demo-collab-1"}`}>View</a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="default" padding="none">
        <CardHeader
          title="Recent Activity"
          description="Latest updates on your applications and collaborations"
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

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          } asChild>
            <a href="/dashboard/creator/campaigns">Browse Campaigns</a>
          </Button>
          <Button variant="outline" leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          } asChild>
            <a href="/dashboard/creator/applications">My Applications</a>
          </Button>
          <Button variant="outline" leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          } asChild>
            <a href="/dashboard/creator/collaborations">My Collaborations</a>
          </Button>
          <Button variant="outline" leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h4M8 12l2-2m0 0l2 2m-2-2v8m-6 0h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          } asChild>
            <a href="/dashboard/creator/conversations">Messages</a>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}