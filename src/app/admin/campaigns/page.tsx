"use client";

import * as React from "react";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  StatsCard,
  DataTable,
  ChartCard,
  BarChart,
  QuickFilter,
  ExportButton,
} from "@/components/admin";
import { MailIcon, PlayIcon, ShieldIcon, UsersIcon, DocumentIcon, PlusIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";

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

export default function AdminCampaignsPage() {
  const activeCount = MOCK_CAMPAIGNS.filter((c) => c.status === "active").length;
  const totalBudget = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.budget, 0);

  const filters = [
    { label: "All", value: "all", count: MOCK_CAMPAIGNS.length },
    { label: "Active", value: "active", count: activeCount },
    { label: "Paused", value: "paused", count: MOCK_CAMPAIGNS.filter((c) => c.status === "paused").length },
    { label: "Completed", value: "completed", count: MOCK_CAMPAIGNS.filter((c) => c.status === "completed").length },
    { label: "Draft", value: "draft", count: MOCK_CAMPAIGNS.filter((c) => c.status === "draft").length },
  ];

  const [activeFilter, setActiveFilter] = React.useState("all");

  const filteredData = activeFilter === "all"
    ? MOCK_CAMPAIGNS
    : MOCK_CAMPAIGNS.filter((c) => c.status === activeFilter);

  return (
    <div className="space-y-8">
      <PageHero
        title="Campaign Management"
        description="Create, track, and manage all customer campaigns. Export data as Excel or PDF reports."
        imagePosition="none"
        cta={{
          label: "Create Campaign",
          href: "#",
        }}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Campaigns"
          value={MOCK_CAMPAIGNS.length}
          icon={() => <DocumentIcon className="h-5 w-5" />}
          color="brand"
        />
        <StatsCard
          title="Active"
          value={activeCount}
          icon={() => <PlayIcon className="h-5 w-5" />}
          color="sage"
        />
        <StatsCard
          title="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          icon={() => <ShieldIcon className="h-5 w-5" />}
          color="accent"
        />
        <StatsCard
          title="Filtered Results"
          value={filteredData.length}
          icon={() => <UsersIcon className="h-5 w-5" />}
          color="neutral"
        />
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 shadow-sm dark:border-neutral-800">
        <div className="border-b border-border-subtle dark:border-neutral-800 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SectionTitle title="All Campaigns" textAlign="left" />
          <div className="flex items-center gap-4">
            <QuickFilter
              filters={filters}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onClear={() => setActiveFilter("all")}
            />
            <Button
              onClick={() => {
                // Create new campaign — in a real app would navigate to a create form
                alert("Create campaign form would open here");
              }}
              className="hidden sm:flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" /> Create Campaign
            </Button>
            <ExportButton data={filteredData} filename="campaigns" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: "id", label: "Campaign ID", width: "140px" },
              { key: "name", label: "Campaign Name", sortable: true },
              { key: "brandName", label: "Brand", sortable: true },
              { key: "influencerName", label: "Influencer", sortable: true },
              {
                key: "status",
                label: "Status",
                sortable: true,
                format: (value) => (
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_COLORS[value as string])}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </span>
                ),
              },
              { key: "budget", label: "Budget", sortable: true, format: (v) => `$${Number(v).toLocaleString()}` },
              { key: "startDate", label: "Start Date", sortable: true, format: (v) => new Date(String(v)).toLocaleDateString() },
              { key: "createdAt", label: "Created", sortable: true, format: (v) => new Date(String(v)).toLocaleDateString() },
            ]}
            data={filteredData}
            onRowClick={(row) => {
              window.location.href = `/admin/campaigns/${row.id}`;
            }}
          />
        </div>
      </div>
    </div>
  );
}
