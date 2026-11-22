"use client";

/**
 * CALLBACX TECHNOLOGY — Admin Collaboration Monitoring
 *
 * Monitor all platform collaborations and their statuses.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminCollaborationRow {
  id: string;
  campaign_id: string;
  campaign_title: string | null;
  creator_id: string;
  creator_name: string | null;
  brand_id: string;
  brand_name: string | null;
  status: string;
  fee_amount: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

const COLUMNS: Column<AdminCollaborationRow>[] = [
  { key: "campaign_title", label: "Campaign", sortable: true, width: "200px" },
  { key: "creator_name", label: "Creator", sortable: true, width: "160px" },
  { key: "brand_name", label: "Brand", sortable: true, width: "160px" },
  { key: "status", label: "Status", sortable: true, width: "140px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "fee_amount", label: "Fee", sortable: true, width: "100px", render: (v) => `$${Number(v || 0).toLocaleString()}` },
  { key: "currency", label: "Currency", sortable: true, width: "80px" },
  { key: "created_at", label: "Created", sortable: true, width: "150px" },
];

const COLLAB_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "negotiating", label: "Negotiating" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "disputed", label: "Disputed" },
];

export default function AdminCollaborationsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminCollaborationRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadCollaborations();
  }, [search, statusFilter, limit, offset]);

  async function loadCollaborations() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/collaborations?${params}`);
      if (!res.ok) throw new Error("Failed to load collaborations");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(collabId: string, status: string, reason?: string) {
    const res = await fetch(`/api/admin/collaborations/${collabId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaboration_id: collabId, status, reason }),
    });
    if (!res.ok) throw new Error("Failed to update collaboration status");
    await loadCollaborations();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:moderation")) {
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
      title="Collaboration Monitoring"
      description="Monitor all platform collaborations."
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
            <Input placeholder="Search collaborations…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={COLLAB_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminCollaborationRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No collaborations found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Set Active",
              variant: "primary",
              icon: <span className="h-4 w-4">✓</span>,
              disabled: (row: AdminCollaborationRow) => row.status === "active",
              onClick: (row: AdminCollaborationRow) => updateStatus(row.id, "active"),
            },
            {
              label: "Pause",
              variant: "ghost",
              icon: <span className="h-4 w-4">⏸</span>,
              disabled: (row: AdminCollaborationRow) => row.status === "paused",
              onClick: (row: AdminCollaborationRow) => updateStatus(row.id, "paused"),
            },
            {
              label: "Cancel",
              variant: "destructive",
              icon: <span className="h-4 w-4">✗</span>,
              disabled: (row: AdminCollaborationRow) => row.status === "cancelled",
              onClick: (row: AdminCollaborationRow) => updateStatus(row.id, "cancelled"),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
