"use client";

/**
 * CALLBACX TECHNOLOGY — Admin Campaign Moderation
 *
 * Campaign moderation and management.
 * Publish, pause, archive, cancel, or reject campaigns.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminCampaignRow {
  id: string;
  title: string;
  status: string;
  budget_total: number;
  budget_currency: string;
  brand_id: string;
  brand_name: string | null;
  creator_count: number;
  application_count: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const COLUMNS: Column<AdminCampaignRow>[] = [
  { key: "title", label: "Campaign Title", sortable: true, width: "220px" },
  { key: "brand_name", label: "Brand", sortable: true, width: "160px" },
  { key: "status", label: "Status", sortable: true, width: "140px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "budget_total", label: "Budget", sortable: true, width: "120px", render: (v) => `$${Number(v || 0).toLocaleString()}` },
  { key: "application_count", label: "Applications", sortable: true, width: "120px" },
  { key: "creator_count", label: "Creators", sortable: true, width: "100px" },
  { key: "created_at", label: "Created", sortable: true, width: "150px" },
];

const CAMPAIGN_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "published", label: "Published" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminCampaignsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminCampaignRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadCampaigns();
  }, [search, statusFilter, limit, offset]);

  async function loadCampaigns() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/campaigns?${params}`);
      if (!res.ok) throw new Error("Failed to load campaigns");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function moderateCampaign(campaignId: string, action: "publish" | "pause" | "archive" | "cancel" | "reject") {
    const reason = prompt(`Reason for ${action} campaign?`);
    const res = await fetch("/api/admin/campaigns/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, action, reason }),
    });
    if (!res.ok) throw new Error("Failed to moderate campaign");
    await loadCampaigns();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:campaigns")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <h1 className="text-xl font-semibold text-text-primary">Access Denied</h1>
      </div>
    );
  }

  const userDisplayName = user.full_name || user.email;

  return (
    <DashboardLayout
      navSections={ADMIN_NAV_SECTIONS}
      title="Campaign Moderation"
      description="Review, publish, pause, or archive campaigns."
      user={{
        name: userDisplayName,
        email: user.email,
        avatar: user.avatar_url ?? undefined,
        role: user.role,
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex-1 sm:w-auto">
            <Input placeholder="Search campaigns…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={CAMPAIGN_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminCampaignRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No campaigns found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Publish",
              variant: "primary",
              icon: <span className="h-4 w-4">▶</span>,
              disabled: (row: AdminCampaignRow) => row.status === "published",
              onClick: (row: AdminCampaignRow) => moderateCampaign(row.id, "publish"),
            },
            {
              label: "Pause",
              variant: "ghost",
              icon: <span className="h-4 w-4">⏸</span>,
              disabled: (row: AdminCampaignRow) => row.status === "paused",
              onClick: (row: AdminCampaignRow) => moderateCampaign(row.id, "pause"),
            },
            {
              label: "Archive",
              variant: "destructive",
              icon: <span className="h-4 w-4">📦</span>,
              disabled: (row: AdminCampaignRow) => row.status === "archived",
              onClick: (row: AdminCampaignRow) => moderateCampaign(row.id, "archive"),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
