"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoDataState } from "@/components/states/Empty";
import { demoData } from "@/services/demo-data";
import { isDemoMode } from "@/context/AuthProvider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceStatus } from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Brand Invoices Page Component
// ---------------------------------------------------------------------------

export default function BrandInvoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState({
    status: "",
  });

  React.useEffect(() => {
    async function fetchInvoices() {
      if (authLoading) return;
      
      setLoading(true);
      try {
        if (isDemoMode) {
          let filtered = demoData.invoices.filter(i => i.brand_id === user?.brand_id);
          
          // Enrich with collaboration and creator data
          const enriched = filtered.map(inv => ({
            ...inv,
            collaboration: demoData.collaborations.find(c => c.id === inv.collaboration_id),
            creator: demoData.creatorProfiles.find(c => c.id === inv.creator_profile_id),
            payment: demoData.paymentTransactions.find(p => p.invoice_id === inv.id),
          }));
          
          if (filters.status) {
            enriched.filter(i => i.status === filters.status);
          }
          
          // Sort by newest first
          enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          setInvoices(enriched);
        } else {
          setInvoices([]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [authLoading, user?.brand_id, filters]);

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === "paid").length,
    pending: invoices.filter(i => i.status === "sent" || i.status === "draft").length,
    overdue: invoices.filter(i => i.status === "overdue").length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    paidAmount: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: invoices.filter(i => i.status === "sent" || i.status === "draft").reduce((sum, i) => sum + i.amount, 0),
  };

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard showImage={false} showAvatar={false} lines={3} />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.brand_id) {
    return (
      <DashboardLayout
        navSections={BRAND_NAV_SECTIONS}
        title="Invoices"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">No brand associated</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Invoices"
      description="Manage invoices and payments"
      user={user}
      topBarActions={
        <Button variant="outline" asChild>
          <a href="/dashboard/brand/invoices/new">Create Invoice</a>
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          value={stats.total}
          label="Total Invoices"
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
        <StatCard
          value={formatCurrency(stats.paidAmount)}
          label="Paid"
          change={`${stats.paid} invoices`}
          changeType="increase"
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          value={formatCurrency(stats.pendingAmount)}
          label="Pending"
          change={`${stats.pending} invoices`}
          changeType="neutral"
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>}
        />
        <StatCard
          value={stats.overdue > 0 ? formatCurrency(invoices.filter(i => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0)) : "$0"}
          label="Overdue"
          change={stats.overdue > 0 ? `${stats.overdue} invoices` : "All caught up"}
          changeType={stats.overdue > 0 ? "decrease" : "neutral"}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      {/* Filters */}
      <Card variant="outlined" padding="md" className="mb-6">
        <Select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          options={[
            { value: "", label: "All Statuses" },
            { value: "draft", label: "Draft" },
            { value: "sent", label: "Sent" },
            { value: "paid", label: "Paid" },
            { value: "overdue", label: "Overdue" },
            { value: "voided", label: "Voided" },
          ]}
          className="w-48"
        />
      </Card>

      {/* Invoices List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} showImage={false} showAvatar={false} lines={3} />)}
        </div>
      ) : invoices.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoDataState
            title="No invoices found"
            description={filters.status ? "Try adjusting your filters." : "No invoices have been created yet."}
            illustration="filter"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Invoice Card Component
// ---------------------------------------------------------------------------

function InvoiceCard({ invoice }: { invoice: any }) {
  const isOverdue = invoice.status !== "paid" && invoice.due_date && new Date(invoice.due_date) < new Date();
  
  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Invoice Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Invoice</p>
                <h3 className="font-semibold text-text-primary">{invoice.invoice_number}</h3>
              </div>
              <StatusBadge status={invoice.status as any} size="sm" />
              {isOverdue && <Badge variant="error" size="sm">Overdue</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-secondary">
              <span>Creator: {invoice.creator?.display_name}</span>
              <span>Campaign: {invoice.collaboration?.campaign?.title}</span>
              <span>Due: {invoice.due_date ? formatDate(invoice.due_date) : "Not set"}</span>
            </div>
          </div>

          {/* Amount & Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(invoice.amount)} {invoice.currency}</p>
              <p className="text-xs text-text-tertiary">{invoice.payment?.status === "succeeded" ? "Payment received" : invoice.payment ? "Payment processing" : "Awaiting payment"}</p>
            </div>
            <div className="flex flex-col gap-2">
              {invoice.pdf_storage_path && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={invoice.pdf_storage_path} target="_blank" rel="noopener noreferrer">View PDF</a>
                </Button>
              )}
              {invoice.status === "sent" && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/dashboard/brand/invoices/${invoice.id}/mark-paid`}>Mark Paid</a>
                </Button>
              )}
              {invoice.status === "draft" && (
                <Button variant="primary" size="sm" asChild>
                  <a href={`/dashboard/brand/invoices/${invoice.id}/send`}>Send Invoice</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}