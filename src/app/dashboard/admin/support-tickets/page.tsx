"use client";

/**
 * CALLBACX TECHNOLOGY — Admin Support Tickets
 *
 * Dispute and support management — Support Tickets tab.
 * View, assign, and manage support tickets.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminTicketRow {
  id: string;
  profile_id: string;
  user_name: string | null;
  user_email: string | null;
  subject: string;
  status: string;
  priority: string;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS: Column<AdminTicketRow>[] = [
  { key: "subject", label: "Subject", sortable: true, width: "220px" },
  { key: "user_name", label: "User", sortable: true, width: "160px" },
  { key: "user_email", label: "Email", sortable: true, width: "200px" },
  { key: "status", label: "Status", sortable: true, width: "120px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "priority", label: "Priority", sortable: true, width: "100px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "assigned_to_name", label: "Assigned To", sortable: true, width: "140px", render: (v) => <span>{String(v || "Unassigned")}</span> },
  { key: "created_at", label: "Created", sortable: true, width: "150px" },
];

const TICKET_STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const TICKET_PRIORITY_OPTIONS = [
  { value: "", label: "All priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function AdminSupportTicketsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminTicketRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadTickets();
  }, [search, statusFilter, priorityFilter, limit, offset]);

  async function loadTickets() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/support-tickets?${params}`);
      if (!res.ok) throw new Error("Failed to load tickets");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function assignTicket(ticketId: string, assignedTo: string | null) {
    const res = await fetch(`/api/admin/support-tickets/${ticketId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: ticketId, assigned_to: assignedTo }),
    });
    if (!res.ok) throw new Error("Failed to assign ticket");
    await loadTickets();
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
      title="Support Tickets"
      description="Manage platform support tickets."
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
            <Input placeholder="Search tickets…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={TICKET_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All status"
            />
            <Select
              options={TICKET_PRIORITY_OPTIONS}
              value={priorityFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
              placeholder="All priority"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminTicketRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No support tickets found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Assign",
              variant: "ghost",
              icon: <span className="h-4 w-4">👤</span>,
              onClick: (row: AdminTicketRow) => {
                const staffId = prompt(`Assign ticket ${row.id} to staff ID:`, "");
                if (staffId) assignTicket(row.id, staffId);
              },
            },
            {
              label: "Mark Resolved",
              variant: "primary",
              icon: <span className="h-4 w-4">✓</span>,
              disabled: (row: AdminTicketRow) => row.status === "resolved" || row.status === "closed",
              onClick: (row: AdminTicketRow) => {
                if (confirm(`Mark ticket ${row.id} as resolved?`)) assignTicket(row.id, null);
              },
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
