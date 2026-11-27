"use client";

import * as React from "react";
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
import { ShieldIcon, BarChart3, UsersIcon } from "@/components/ui/icons";

interface CampaignReport {
  id: string;
  campaignName: string;
  brand: string;
  influencer: string;
  status: string;
  budget: number;
  spend: number;
  reach: number;
  engagement: number;
  conversions: number;
  roi: number;
  createdAt: string;
}

const MOCK_REPORTS: CampaignReport[] = [
  {
    id: "RPT-001",
    campaignName: "Summer Fashion Launch",
    brand: "Thread & Co",
    influencer: "Maya Chen",
    status: "active",
    budget: 15000,
    spend: 11250,
    reach: 125000,
    engagement: 4.2,
    conversions: 3400,
    roi: 3.4,
    createdAt: "2026-05-15T00:00:00Z",
  },
  {
    id: "RPT-002",
    campaignName: "Wellness Retreat Campaign",
    brand: "Calm Collective",
    influencer: "Jordan Smith",
    status: "paused",
    budget: 22000,
    spend: 8800,
    reach: 89000,
    engagement: 3.8,
    conversions: 2100,
    roi: 2.8,
    createdAt: "2026-06-10T00:00:00Z",
  },
  {
    id: "RPT-003",
    campaignName: "Tech Gadget Review",
    brand: "Nova Devices",
    influencer: "Alex Rivera",
    status: "completed",
    budget: 18000,
    spend: 18000,
    reach: 210000,
    engagement: 5.1,
    conversions: 5600,
    roi: 4.2,
    createdAt: "2026-03-20T00:00:00Z",
  },
  {
    id: "RPT-004",
    campaignName: "Eco Beauty Line",
    brand: "Green Bloom",
    influencer: "Sofia Martinez",
    status: "active",
    budget: 12000,
    spend: 7200,
    reach: 98000,
    engagement: 4.7,
    conversions: 2800,
    roi: 3.9,
    createdAt: "2026-07-05T00:00:00Z",
  },
  {
    id: "RPT-005",
    campaignName: "Home Decor Refresh",
    brand: "Nest & Nook",
    influencer: "Liam O'Connor",
    status: "draft",
    budget: 9000,
    spend: 0,
    reach: 0,
    engagement: 0,
    conversions: 0,
    roi: 0,
    createdAt: "2026-07-12T00:00:00Z",
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-300",
  paused: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/20 dark:text-neutral-300",
  completed: "bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300",
  draft: "bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-300",
};

export default function AdminReportsPage() {
  const totalBudget = MOCK_REPORTS.reduce((sum, r) => sum + r.budget, 0);
  const totalSpend = MOCK_REPORTS.reduce((sum, r) => sum + r.spend, 0);
  const totalReach = MOCK_REPORTS.reduce((sum, r) => sum + r.reach, 0);
  const totalConversions = MOCK_REPORTS.reduce((sum, r) => sum + r.conversions, 0);
  const avgROI =
    MOCK_REPORTS.filter((r) => r.roi > 0).reduce((sum, r) => sum + r.roi, 0) /
    MOCK_REPORTS.filter((r) => r.roi > 0).length;

  const monthlyPerformance = [
    { name: "May", spend: 8500, reach: 45000, conversions: 1200 },
    { name: "Jun", spend: 12400, reach: 78000, conversions: 2100 },
    { name: "Jul", spend: 15600, reach: 112000, conversions: 2900 },
    { name: "Aug", spend: 18900, reach: 156000, conversions: 3800 },
    { name: "Sep", spend: 22100, reach: 189000, conversions: 4500 },
    { name: "Oct", spend: 19800, reach: 167000, conversions: 4100 },
  ];

  const brandPerformance = [
    { name: "Thread & Co", value: 3400 },
    { name: "Nova Devices", value: 5600 },
    { name: "Green Bloom", value: 2800 },
    { name: "Calm Collective", value: 2100 },
    { name: "Nest & Nook", value: 0 },
  ];

  return (
    <div className="space-y-8">
      <PageHero
        title="Data Analyst Reports"
        description="Comprehensive campaign analytics, performance insights, and exportable reports for data-driven decisions."
        imagePosition="none"
        cta={{
          label: "Export All Reports",
          href: "#",
        }}
      />

      {/* Executive Summary Stats */}
      <SectionTitle title="Executive Summary" textAlign="left" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          icon={() => <ShieldIcon className="h-5 w-5" />}
          color="brand"
        />
        <StatsCard
          title="Total Spend"
          value={`$${totalSpend.toLocaleString()}`}
          change={{ value: `(${((totalSpend / totalBudget) * 100).toFixed(1)}% of budget)`, positive: false }}
          trend="down"
          icon={() => <DollarSignIcon className="h-5 w-5" />}
          color="accent"
        />
        <StatsCard
          title="Total Reach"
          value={totalReach.toLocaleString()}
          icon={() => <UsersIcon className="h-5 w-5" />}
          color="sage"
        />
        <StatsCard
          title="Total Conversions"
          value={totalConversions.toLocaleString()}
          icon={() => <TargetIcon className="h-5 w-5" />}
          color="brand"
        />
        <StatsCard
          title="Avg ROI"
          value={avgROI.toFixed(2)}
          change={{ value: "+0.4 vs last quarter", positive: true }}
          trend="up"
          icon={() => <TrendingUpIcon className="h-5 w-5" />}
          color="sage"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Spend vs Reach"
          subtitle="Campaign spending and audience reach over time"
        >
          <div className="flex items-end justify-between gap-4 h-[200px]">
            <LineChart
              data={monthlyPerformance.map((d) => ({ name: d.name, value: d.spend }))}
              color="#4f46e5"
            />
          </div>
        </ChartCard>
        <ChartCard
          title="Conversions by Brand"
          subtitle="Top performing brands by conversion volume"
        >
          <BarChart data={brandPerformance} color="#d9653e" />
        </ChartCard>
      </div>

      {/* Reports Table with Export */}
      <SectionTitle title="Campaign Reports" textAlign="left" />
      <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 shadow-sm dark:border-neutral-800 overflow-hidden">
        <div className="border-b border-border-subtle dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">All Campaign Reports</h3>
            <p className="text-xs text-text-tertiary mt-1">
              {MOCK_REPORTS.length} campaigns • {MOCK_REPORTS.filter((r) => r.status === "active").length} active
            </p>
          </div>
          <div className="flex items-center gap-4">
            <QuickFilter
              filters={[
                { label: "All", value: "all", count: MOCK_REPORTS.length },
                { label: "Active", value: "active", count: MOCK_REPORTS.filter((r) => r.status === "active").length },
                { label: "Completed", value: "completed", count: MOCK_REPORTS.filter((r) => r.status === "completed").length },
                { label: "Paused", value: "paused", count: MOCK_REPORTS.filter((r) => r.status === "paused").length },
                { label: "Draft", value: "draft", count: MOCK_REPORTS.filter((r) => r.status === "draft").length },
              ]}
              activeFilter="all"
              onFilterChange={() => {}}
              onClear={() => {}}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const csvData = MOCK_REPORTS.map((r) => ({
                    "Report ID": r.id,
                    "Campaign": r.campaignName,
                    "Brand": r.brand,
                    "Influencer": r.influencer,
                    "Status": r.status,
                    "Budget ($)": r.budget,
                    "Spend ($)": r.spend,
                    "Reach": r.reach,
                    "Engagement (%)": r.engagement,
                    "Conversions": r.conversions,
                    "ROI": r.roi,
                    "Created At": r.createdAt,
                  }));
                  import("../../../components/admin/export").then(({ exportToCsv }) => {
                    exportToCsv(
                      Object.keys(csvData[0] || {}),
                      csvData,
                      "callbacx-reports"
                    );
                  });
                }}
                className="flex items-center gap-2 text-sm font-medium"
                variant="outline"
                size="sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg> Excel (CSV)
              </Button>
              <Button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-sm font-medium"
                variant="outline"
                size="sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg> PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: "id", label: "Report ID", width: "120px" },
              { key: "campaignName", label: "Campaign" },
              { key: "brand", label: "Brand" },
              { key: "influencer", label: "Influencer" },
              {
                key: "status",
                label: "Status",
                format: (value) => (
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_COLORS[value as string])}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                ),
              },
              { key: "budget", label: "Budget", format: (v) => `$${Number(v).toLocaleString()}` },
              { key: "spend", label: "Spend", format: (v) => `$${Number(v).toLocaleString()}` },
              { key: "reach", label: "Reach", format: (v) => Number(v).toLocaleString() },
              { key: "engagement", label: "Engagement", format: (v) => `${Number(v)}%` },
              { key: "conversions", label: "Conversions", format: (v) => Number(v).toLocaleString() },
              { key: "roi", label: "ROI", format: (v) => `${Number(v).toFixed(2)}x` },
            ]}
            data={MOCK_REPORTS.map((r) => ({
              id: r.id,
              campaignName: r.campaignName,
              brand: r.brand,
              influencer: r.influencer,
              status: r.status,
              budget: r.budget,
              spend: r.spend,
              reach: r.reach,
              engagement: r.engagement,
              conversions: r.conversions,
              roi: r.roi,
            }))}
          />
        </div>
      </div>

      {/* Sustainability & Security Note */}
      <div className="rounded-2xl border border-border-subtle bg-neutral-50/50 dark:bg-neutral-800/30 p-6 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Data Analyst Notes</h3>
        <ul className="space-y-2 text-xs text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
            All reports are email-managed — no public dashboards or member portals
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
            Export as CSV opens natively in Excel; PDF via browser print
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
            CSRF tokens protect all state-changing admin actions
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
            Dark mode reduces energy consumption on OLED displays
          </li>
        </ul>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

function DollarSignIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0-7V9a2 2 0 012 2h2a2 2 0 012-2m0 0V5a2 2 0 002-2h2a2 2 0 002 2v2a2 2 0 002 2zm-7 4h2a2 2 0 002-2m0 0v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2m0 4v2a2 2 0 002 2h2a2 2 0 002-2m-6 0h2a2 2 0 012-2m0 0v-2a2 2 0 002-2h2a2 2 0 002 2v2a2 2 0 00-2 2h-2a2 2 0 00-2-2m0-4V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2m-2 8h2a2 2 0 002-2m0 0v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2m0 4v2a2 2 0 00-2 2h-2a2 2 0 01-2-2v-2a2 2 0 002-2h2" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
