"use client";

/**
 * CALLBACX MARKETING — Admin Announcements
 *
 * Announcements and alerts — Announcements tab.
 * Create, edit, and publish platform-wide announcements.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminAnnouncementRow {
  id: string;
  title: string;
  content: string;
  status: string;
  target_audience: string;
  priority: string;
  created_by_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const COLUMNS: Column<AdminAnnouncementRow>[] = [
  { key: "title", label: "Title", sortable: true, width: "220px" },
  { key: "target_audience", label: "Audience", sortable: true, width: "140px" },
  { key: "priority", label: "Priority", sortable: true, width: "100px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "status", label: "Status", sortable: true, width: "100px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "created_by_name", label: "Created By", sortable: true, width: "140px" },
  { key: "starts_at", label: "Starts", sortable: true, width: "130px" },
  { key: "ends_at", label: "Ends", sortable: true, width: "130px" },
];

const ANNOUNCEMENT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const ANNOUNCEMENT_PRIORITY_OPTIONS = [
  { value: "", label: "All priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function AdminAnnouncementsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminAnnouncementRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadAnnouncements();
  }, [search, statusFilter, priorityFilter, limit, offset]);

  async function loadAnnouncements() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/announcements?${params}`);
      if (!res.ok) throw new Error("Failed to load announcements");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(announcementId: string, status: string) {
    const res = await fetch(`/api/admin/announcements/${announcementId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement_id: announcementId, status }),
    });
    if (!res.ok) throw new Error("Failed to change announcement status");
    await loadAnnouncements();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:announcements")) {
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
      title="Announcements"
      description="Create and manage platform-wide announcements."
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
            <Input placeholder="Search announcements…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={ANNOUNCEMENT_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
            />
            <Select
              options={ANNOUNCEMENT_PRIORITY_OPTIONS}
              value={priorityFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
              placeholder="All priority"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminAnnouncementRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No announcements found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Publish",
              variant: "primary",
              icon: <span className="h-4 w-4">▶</span>,
              disabled: (row: AdminAnnouncementRow) => row.status === "published",
              onClick: (row: AdminAnnouncementRow) => changeStatus(row.id, "published"),
            },
            {
              label: "Archive",
              variant: "destructive",
              icon: <span className="h-4 w-4">📦</span>,
              disabled: (row: AdminAnnouncementRow) => row.status === "archived",
              onClick: (row: AdminAnnouncementRow) => changeStatus(row.id, "archived"),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
