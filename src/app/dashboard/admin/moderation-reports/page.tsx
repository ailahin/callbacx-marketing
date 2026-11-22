"use client";

/**
 * CALLBACX MARKETING — Admin Moderation Reports
 *
 * Reports and alerts — Moderation Reports tab.
 * Review content flagged by users and take moderation action.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminModerationReportRow {
  id: string;
  reported_profile_id: string;
  reporter_profile_id: string;
  reason: string;
  category: string;
  status: string;
  reported_at: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
}

const COLUMNS: Column<AdminModerationReportRow>[] = [
  { key: "reported_profile_id", label: "Reported Profile", sortable: true, width: "160px" },
  { key: "reporter_profile_id", label: "Reporter", sortable: true, width: "160px" },
  { key: "category", label: "Category", sortable: true, width: "160px" },
  { key: "status", label: "Status", sortable: true, width: "120px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "reason", label: "Reason", sortable: false, width: "260px", render: (v) => String(v || "").slice(0, 100) + (String(v || "").length > 100 ? "…" : "") },
  { key: "action_taken", label: "Action", sortable: false, width: "160px", render: (v) => String(v || "—") },
  { key: "reported_at", label: "Reported", sortable: true, width: "150px" },
];

const MOD_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const MOD_CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "impersonation", label: "Impersonation" },
  { value: "scam_fraud", label: "Scam / Fraud" },
  { value: "other", label: "Other" },
];

export default function AdminModerationReportsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminModerationReportRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadReports();
  }, [search, statusFilter, categoryFilter, limit, offset]);

  async function loadReports() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/moderation-reports?${params}`);
      if (!res.ok) throw new Error("Failed to load moderation reports");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function takeAction(reportId: string, action: string, status: "resolved" | "dismissed") {
    const reason = prompt(`Reason for ${action}:`);
    const res = await fetch(`/api/admin/moderation-reports/${reportId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportId, action, status, reason }),
    });
    if (!res.ok) throw new Error("Failed to take moderation action");
    await loadReports();
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
      title="Moderation Reports"
      description="Review content flagged by the community."
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
            <Input placeholder="Search reports…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={MOD_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
            />
            <Select
              options={MOD_CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
              placeholder="All categories"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminModerationReportRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No moderation reports found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Resolve",
              variant: "primary",
              icon: <span className="h-4 w-4">✓</span>,
              disabled: (row: AdminModerationReportRow) => row.status === "resolved",
              onClick: (row: AdminModerationReportRow) => takeAction(row.id, "resolve", "resolved"),
            },
            {
              label: "Dismiss",
              variant: "ghost",
              icon: <span className="h-4 w-4">✕</span>,
              disabled: (row: AdminModerationReportRow) => row.status === "dismissed",
              onClick: (row: AdminModerationReportRow) => takeAction(row.id, "dismiss", "dismissed"),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
