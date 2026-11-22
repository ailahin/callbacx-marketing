"use client";

/**
 * CALLBACX TECHNOLOGY — Admin Activity Logs
 *
 * Activity logs and auditing — Activity Logs tab.
 * View platform activity history with pagination and filtering.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminActivityLogRow {
  id: string;
  actor_name: string | null;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const COLUMNS: Column<AdminActivityLogRow>[] = [
  { key: "actor_name", label: "Actor", sortable: true, width: "160px" },
  { key: "action", label: "Action", sortable: true, width: "140px" },
  { key: "resource_type", label: "Resource Type", sortable: true, width: "140px" },
  { key: "resource_id", label: "Resource ID", sortable: true, width: "120px" },
  { key: "details", label: "Details", sortable: false, width: "260px", render: (v) => String(v || "—").slice(0, 120) + (String(v || "").length > 120 ? "…" : "") },
  { key: "ip_address", label: "IP Address", sortable: true, width: "140px" },
  { key: "created_at", label: "Time", sortable: true, width: "160px" },
];

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "create", label: "Create" },
  { value: "read", label: "Read" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "verify", label: "Verify" },
  { value: "moderate", label: "Moderate" },
];

export default function AdminActivityLogsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminActivityLogRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(50);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadLogs();
  }, [search, actionFilter, limit, offset]);

  async function loadLogs() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (actionFilter) params.set("action", actionFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/activity-logs?${params}`);
      if (!res.ok) throw new Error("Failed to load activity logs");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:activity_logs")) {
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
      title="Activity Logs"
      description="View platform activity and audit history."
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
            <Input placeholder="Search activity logs…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={ACTION_OPTIONS}
              value={actionFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActionFilter(e.target.value)}
              placeholder="All actions"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminActivityLogRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No activity logs found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
