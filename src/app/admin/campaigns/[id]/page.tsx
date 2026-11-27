"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  StatsCard,
  DataTable,
  ChartCard,
  BarChart,
  LineChart,
  ExportButton,
  QuickFilter,
} from "@/components/admin";
import { Button } from "@/components/ui/Button";
import {
  MailIcon,
  PlayIcon,
  ShieldIcon,
  UsersIcon,
  DocumentIcon,
  TrendingUpIcon,
  UserIcon,
  TargetIcon,
} from "@/components/ui/icons";

interface Campaign {
  id: string;
  name: string;
  brandName: string;
  influencerName: string;
  status: string;
  budget: number;
  currency: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

interface CampaignMetric {
  name: string;
  value: number;
  change: string;
  positive: boolean;
}

const MOCK_CAMPAIGNS: Record<string, Campaign> = {
  "CMP-001": {
    id: "CMP-001",
    name: "Summer Fashion Launch",
    brandName: "Thread & Co",
    influencerName: "Maya Chen",
    status: "active",
    budget: 15000,
    currency: "USD",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-08-31T00:00:00Z",
    createdAt: "2026-05-15T00:00:00Z",
  },
  "CMP-002": {
    id: "CMP-002",
    name: "Wellness Retreat Campaign",
    brandName: "Calm Collective",
    influencerName: "Jordan Smith",
    status: "paused",
    budget: 22000,
    currency: "USD",
    startDate: "2026-07-01T00:00:00Z",
    endDate: "2026-09-30T00:00:00Z",
    createdAt: "2026-06-10T00:00:00Z",
  },
  "CMP-003": {
    id: "CMP-003",
    name: "Tech Gadget Review",
    brandName: "Nova Devices",
    influencerName: "Alex Rivera",
    status: "completed",
    budget: 18000,
    currency: "USD",
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-06-30T00:00:00Z",
    createdAt: "2026-03-20T00:00:00Z",
  },
  "CMP-004": {
    id: "CMP-004",
    name: "Eco Beauty Line",
    brandName: "Green Bloom",
    influencerName: "Sofia Martinez",
    status: "active",
    budget: 12000,
    currency: "USD",
    startDate: "2026-08-01T00:00:00Z",
    endDate: "2026-10-31T00:00:00Z",
    createdAt: "2026-07-05T00:00:00Z",
  },
  "CMP-005": {
    id: "CMP-005",
    name: "Home Decor Refresh",
    brandName: "Nest & Nook",
    influencerName: "Liam O'Connor",
    status: "draft",
    budget: 9000,
    currency: "USD",
    startDate: "2026-09-01T00:00:00Z",
    createdAt: "2026-07-12T00:00:00Z",
  },
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-300",
  paused: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/20 dark:text-neutral-300",
  completed: "bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300",
  draft: "bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-300",
};

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const id = (params as { id: string }).id;
  const campaign = MOCK_CAMPAIGNS[id];

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Campaign not found</h2>
        <p className="text-text-secondary">The campaign you're looking for doesn't exist.</p>
      </div>
    );
  }

  const metrics: CampaignMetric[] = [
    { name: "Engagement Rate", value: 4.2, change: "+0.8 vs last month", positive: true },
    { name: "Reach", value: 125000, change: "+12% vs last month", positive: true },
    { name: "Impressions", value: 450000, change: "+8% vs last month", positive: true },
    { name: "Conversions", value: 3400, change: "+15% vs last month", positive: true },
  ];

  const performanceData = [
    { name: "Week 1", value: 45 },
    { name: "Week 2", value: 72 },
    { name: "Week 3", value: 68 },
    { name: "Week 4", value: 95 },
    { name: "Week 5", value: 110 },
    { name: "Week 6", value: 85 },
  ];

  const audienceData = [
    { name: "18-24", value: 35 },
    { name: "25-34", value: 42 },
    { name: "35-44", value: 18 },
    { name: "45+", value: 5 },
  ];

  return (
    <div className="space-y-8">
      <PageHero
        title={`Campaign: ${campaign.name}`}
        description={`Customer campaign report for ${campaign.brandName} with influencer ${campaign.influencerName}. Export data as Excel or PDF.`}
        imagePosition="none"
        cta={{
          label: "Back to Campaigns",
          href: "/admin/campaigns",
        }}
      />

      {/* Campaign Info Header */}
      <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 p-6 shadow-sm dark:border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{campaign.name}</h1>
            <p className="text-text-secondary mt-1">
              <span className="text-brand-600 dark:text-brand-400 font-medium">{campaign.brandName}</span>
              &nbsp;×&nbsp;
              <span className="text-text-primary font-medium">{campaign.influencerName}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={cn("px-3 py-1 rounded-full text-xs font-medium", STATUS_COLORS[campaign.status])}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/20">
              {campaign.currency} {campaign.budget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Export this campaign as CSV
                const csvData = [campaign];
                import("../../../../components/admin/export").then(({ exportCampaignsToCsv }) => {
                  exportCampaignsToCsv(csvData, `campaign-${campaign.id}`);
                });
              }}
            >
              <DocumentIcon className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 inline">🖨️</span> Print Report
              </span>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border-subtle bg-neutral-50/50 dark:bg-neutral-800/30 p-4 dark:border-neutral-800">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Brand</p>
            <p className="text-sm text-text-primary">{campaign.brandName}</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-neutral-50/50 dark:bg-neutral-800/30 p-4 dark:border-neutral-800">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Influencer</p>
            <p className="text-sm text-text-primary">{campaign.influencerName}</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-neutral-50/50 dark:bg-neutral-800/30 p-4 dark:border-neutral-800">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Status</p>
            <p className="text-sm text-text-primary">
              <span className={cn("font-medium", STATUS_COLORS[campaign.status])}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-neutral-50/50 dark:bg-neutral-800/30 p-4 dark:border-neutral-800">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Budget</p>
            <p className="text-sm text-text-primary">{campaign.currency} {campaign.budget.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-neutral-50/50 dark:bg-neutral-800/30 p-4 dark:border-neutral-800">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Start Date</p>
            <p className="text-sm text-text-primary">{new Date(campaign.startDate).toLocaleDateString()}</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-neutral-50/50 dark:bg-neutral-800/30 p-4 dark:border-neutral-800">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">End Date</p>
            <p className="text-sm text-text-primary">{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "Ongoing"}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <SectionTitle title="Key Performance Metrics" textAlign="left" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <StatsCard
            key={m.name}
            title={m.name}
            value={m.name === "Reach" || m.name === "Impressions" || m.name === "Conversions" ? m.value.toLocaleString() : m.value}
            change={{ value: m.change, positive: m.positive }}
            trend={m.positive ? "up" : "down"}
            icon={() => {
              if (m.name === "Engagement Rate") return <TargetIcon className="h-5 w-5" />;
              if (m.name === "Reach") return <UsersIcon className="h-5 w-5" />;
              if (m.name === "Impressions") return <EyeIcon className="h-5 w-5" />;
              return <DollarSignIcon className="h-5 w-5" />;
            }}
            color="brand"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Performance Over Time" subtitle="Weekly engagement metrics">
            <LineChart data={performanceData} color="#4f46e5" />
          </ChartCard>

          {/* Audience Demographics */}
          <ChartCard title="Audience Demographics" subtitle="Age distribution of campaign audience">
            <BarChart data={audienceData} color="#d9653e" />
          </ChartCard>
        </div>

        {/* Right Sidebar: Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 p-6 shadow-sm dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Campaign Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => {
                  import("../../../../components/admin/export").then(({ exportCampaignsToCsv }) => {
                    exportCampaignsToCsv([campaign], `campaign-${campaign.id}`);
                  });
                }}
                className="w-full text-left justify-start gap-2"
              >
                <DocumentIcon className="h-4 w-4" /> Download Excel (CSV)
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="w-full text-left justify-start gap-2"
              >
                <span className="h-4 w-4 inline">🖨️</span> Generate PDF Report
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `mailto:hello@callbacxmarketing.com?subject=Campaign Report: ${campaign.name}`;
                }}
                className="w-full text-left justify-start gap-2"
              >
                <MailIcon className="h-4 w-4" /> Email Report to Brand
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 p-6 shadow-sm dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Data Security</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
                CSRF-protected exports
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
                No data stored locally
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
                Secure headers enforced
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Data Table */}
      <SectionTitle title="Detailed Campaign Data" textAlign="left" />
      <DataTable
        columns={[
          { key: "metric", label: "Metric" },
          { key: "value", label: "Value" },
          { key: "change", label: "Change" },
        ]}
        data={metrics.map((m, i) => ({
          id: i.toString(),
          metric: m.name,
          value: m.name === "Engagement Rate" ? `${m.value}%` : m.value.toLocaleString(),
          change: m.change,
        }))}
      />
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7m-11.5 2c-3.512 0-6.488-2.348-7.482-5.944C4.108 6.545 5.898 4 9.438 4c1.923 0 3.567 1.253 4.469 2.625a13.1 13.1 0 011.632 2.755c-.478.324-.896.737-1.219 1.219a13.1 13.1 0 01-2.755 1.632C6.88 15.286 5.636 16.93 5.458 19z" />
    </svg>
  );
}

function DollarSignIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
