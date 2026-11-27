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
import { ShieldIcon, MailIcon, UsersIcon, PlayIcon } from "@/components/ui/icons";

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

const MOCK_CAMPAIGNS: Campaign[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-sage-100 text-sage-700 dark:bg-sage-900/20 dark:text-sage-300",
  paused: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/20 dark:text-neutral-300",
  completed: "bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300",
  draft: "bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-300",
};

export default function AdminDashboardPage() {
  const activeCount = MOCK_CAMPAIGNS.filter((c) => c.status === "active").length;
  const totalBudget = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.budget, 0);
  const completedCount = MOCK_CAMPAIGNS.filter((c) => c.status === "completed").length;

  const statusDistribution = [
    { name: "Active", value: activeCount },
    { name: "Paused", value: MOCK_CAMPAIGNS.filter((c) => c.status === "paused").length },
    { name: "Completed", value: completedCount },
    { name: "Draft", value: MOCK_CAMPAIGNS.filter((c) => c.status === "draft").length },
  ];

  const monthlyData = [
    { name: "May", value: 45 },
    { name: "Jun", value: 72 },
    { name: "Jul", value: 68 },
    { name: "Aug", value: 95 },
    { name: "Sep", value: 110 },
    { name: "Oct", value: 85 },
  ];

  const filters = [
    { label: "Active", value: "active", count: activeCount },
    { label: "Paused", value: "paused", count: MOCK_CAMPAIGNS.filter((c) => c.status === "paused").length },
    { label: "Completed", value: "completed", count: completedCount },
    { label: "Draft", value: "draft", count: MOCK_CAMPAIGNS.filter((c) => c.status === "draft").length },
  ];

  return (
    <div className="space-y-8">
      <PageHero
        title="Admin Dashboard"
        description="Manage campaigns, view data analyst reports, and export campaign data securely."
        imagePosition="none"
        cta={{
          label: "New Campaign",
          href: "/admin/campaigns",
        }}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Campaigns"
          value={MOCK_CAMPAIGNS.length}
          change={{ value: "+12% vs last month", positive: true }}
          trend="up"
          icon={() => <MailIcon className="h-5 w-5" />}
          color="brand"
          subtitle="Campaigns managed this quarter"
        />
        <StatsCard
          title="Active Campaigns"
          value={activeCount}
          change={{ value: "+3 this week", positive: true }}
          trend="up"
          icon={() => <PlayIcon className="h-5 w-5" />}
          color="sage"
          subtitle="Currently running campaigns"
        />
        <StatsCard
          title="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          change={{ value: "+8% vs last quarter", positive: true }}
          trend="up"
          icon={() => <ShieldIcon className="h-5 w-5" />}
          color="accent"
          subtitle="Combined campaign budgets"
        />
        <StatsCard
          title="Completed"
          value={completedCount}
          change={{ value: "+2 this month", positive: true }}
          trend="up"
          icon={() => <UsersIcon className="h-5 w-5" />}
          color="neutral"
          subtitle="Successfully delivered campaigns"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Campaigns Table */}
        <div className="lg:col-span-2">
          <SectionTitle title="Recent Campaigns" textAlign="left" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <QuickFilter
                filters={filters}
                activeFilter="all"
                onFilterChange={() => {}}
                onClear={() => {}}
              />
              <ExportButton data={MOCK_CAMPAIGNS} filename="campaigns" />
            </div>
            <DataTable
              columns={[
                { key: "id", label: "Campaign ID", width: "120px" },
                { key: "name", label: "Campaign Name", sortable: true },
                { key: "brandName", label: "Brand", sortable: true },
                { key: "influencerName", label: "Influencer", sortable: true },
                {
                  key: "status",
                  label: "Status",
                  sortable: true,
                  format: (value) => (
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", STATUS_COLORS[value as string])}>
                      {value}
                    </span>
                  ),
                },
                { key: "budget", label: "Budget", sortable: true, format: (v) => `$${Number(v).toLocaleString()}` },
                { key: "createdAt", label: "Created", sortable: true, format: (v) => new Date(String(v)).toLocaleDateString() },
              ]}
              data={MOCK_CAMPAIGNS}
              onRowClick={(row) => {
                // Navigate to campaign detail
                window.location.href = `/admin/campaigns/${row.id}`;
              }}
            />
          </div>
        </div>

        {/* Right: Charts */}
        <div className="lg:col-span-1 space-y-6">
          <ChartCard
            title="Campaigns by Status"
            subtitle="Distribution of campaign statuses"
          >
            <BarChart data={statusDistribution} color="#4f46e5" />
          </ChartCard>
          <ChartCard
            title="Monthly Activity"
            subtitle="Campaigns created per month"
          >
            <LineChart data={monthlyData} color="#4f46e5" />
          </ChartCard>
          <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 p-6 shadow-sm dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Sustainability</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
                No public dashboards — reduces server load
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
                Email-managed campaigns — minimal data transfer
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-brand-600 dark:text-brand-400">•</span>
                Dark mode support — energy efficient on OLED screens
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
