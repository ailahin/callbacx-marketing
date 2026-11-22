"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState } from "@/components/states/Empty";
import { isDemoMode } from "@/context/AuthProvider";
import { demoData } from "@/services/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Brand Invoice Payment Checkout Page
// ---------------------------------------------------------------------------

export default function BrandInvoicePayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoiceId = (params?.id as string) ?? "";

  const { user, loading: authLoading } = useAuth();
  const [invoice, setInvoice] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [cancelled, setCancelled] = React.useState(false);

  React.useEffect(() => {
    if (authLoading) return;
    if (!invoiceId) {
      setError(new Error("Invoice ID is missing."));
      setLoading(false);
      return;
    }

    async function fetchInvoice() {
      setLoading(true);
      try {
        if (isDemoMode) {
          const demoInvoice = demoData.invoices.find(
            (i) => i.id === invoiceId || i.invoice_number === invoiceId,
          );
          setInvoice(demoInvoice ?? null);
        } else {
          const res = await fetch(`/api/payments/invoices/${invoiceId}`, { cache: "no-store" });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error?.message || "Failed to load invoice.");
          setInvoice(json?.data ?? null);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [authLoading, invoiceId]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams(window.location.search);
    if (query.get("cancelled") === "1") {
      setCancelled(true);
    }
    const sid = query.get("session_id");
    if (sid) setSessionId(sid);
  }, []);

  const creatorName = invoice?.creator?.display_name
    ?? invoice?.creator_profile_id
      ? `Creator ${(invoice?.creator_profile_id ?? "").slice(0, 8)}`
      : "Creator";

  const handleCheckout = async () => {
    if (!invoice) return;
    setCreating(true);
    setError(null);
    try {
      const successUrl = `${window.location.origin}/dashboard/brand/invoices/${invoice.id}/pay?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/dashboard/brand/invoices/${invoice.id}/pay?cancelled=1`;

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaboration_id: invoice.collaboration_id,
          invoice_id: invoice.id,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Failed to start secure checkout.");
      const { checkout_url, session_id, transaction_id } = json?.data ?? {};
      if (!checkout_url) {
        throw new Error("Checkout session could not be created. Please try again.");
      }
      window.location.href = checkout_url;
    } catch (err) {
      setError(err as Error);
      setCreating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout navSections={BRAND_NAV_SECTIONS} title="Loading..." user={null}>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <SkeletonCard showImage={false} showAvatar={false} lines={3} />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.brand_id) {
    const layoutUser = user ? { name: user.full_name || user.email, email: user.email, avatar: user.avatar_url ?? undefined, role: user.role } : null;
    return (
      <DashboardLayout navSections={BRAND_NAV_SECTIONS} title="Payment" user={layoutUser}>
        <Card variant="outlined" padding="lg">
          <EmptyState
            title="No brand associated"
            description="You need a brand account to complete payments."
          />
        </Card>
      </DashboardLayout>
    );
  }

  const amountDue = invoice?.status === "paid" ? 0 : invoice?.amount ?? 0;
  const isPaid = invoice?.status === "paid";

  const layoutUser = user ? { name: user.full_name || user.email, email: user.email, avatar: user.avatar_url ?? undefined, role: user.role } : null;

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Secure Checkout"
      description={invoice ? `Invoice ${invoice.invoice_number}` : "Payment"}
      user={layoutUser}
      topBarActions={
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/brand/invoices")}>
          Back to Invoices
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {cancelled && !isPaid && (
          <Card variant="outlined" padding="lg">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-text-primary mb-2">Checkout cancelled</h2>
              <p className="text-text-secondary">No payment was completed. You can try again when ready.</p>
            </div>
          </Card>
        )}

        {isPaid ? (
          <Card variant="outlined" padding="lg">
            <div className="text-center py-10">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Payment received</h2>
              <p className="text-text-secondary mb-6">
                Invoice {invoice?.invoice_number} has been marked as paid.
              </p>
              <Button variant="outline" onClick={() => router.push("/dashboard/brand/invoices")}>
                Back to Invoices
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card variant="outlined" padding="lg">
              <CardHeader>
                <h3 className="text-lg font-semibold">Invoice Summary</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Invoice</span>
                      <span className="font-semibold text-text-primary">{invoice.invoice_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Creator</span>
                      <span className="font-medium text-text-primary">{creatorName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Status</span>
                      <StatusBadge status={(invoice.status === "overdue" ? "failed" : invoice.status) as any} size="sm" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                      <span className="text-text-primary font-medium">Amount Due</span>
                      <span className="text-2xl font-bold text-text-primary">
                        {formatCurrency(amountDue)} {invoice.currency}
                      </span>
                    </div>
                    {invoice.due_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Due Date</span>
                        <span className="text-text-primary">{formatDate(invoice.due_date)}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
                {error.message}
              </div>
            )}

            <Card variant="outlined" padding="lg">
              <CardContent className="space-y-4">
                <p className="text-sm text-text-secondary">
                  You will be redirected to Stripe’s secure checkout to complete your payment. Card details are
                  collected and processed by Stripe — never by CALLBACX directly.
                </p>
                <div className="flex items-center gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-4">
                  <svg className="h-5 w-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Powered by Stripe</p>
                    <p className="text-xs text-text-tertiary">Secure, PCI-compliant payment processing</p>
                  </div>
                </div>
                <Button variant="primary" size="lg" fullWidth onClick={handleCheckout} loading={creating}>
                  {creating ? "Preparing secure checkout…" : "Proceed to Secure Checkout"}
                </Button>
                <Button variant="ghost" size="sm" fullWidth onClick={() => router.push("/dashboard/brand/invoices")}>
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
