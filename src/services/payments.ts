/**
 * CALLBACX TECHNOLOGY — Payments service
 *
 * Invoices, payment transactions, payouts, refunds, platform commission,
 * campaign budget tracking and financial reporting.
 * - Invoices: brand owner creates; creator reads.
 * - Payment transactions: inserted server-side only (after provider confirmation).
 * - Refunds: staff only.
 * - Money uses numeric (never float). No card data ever stored.
 *
 * Financial consistency: payment recording goes through the single Postgres
 * function `fn_record_payment_transaction` whose side effects (platform
 * commission in `platform_fees` + campaign budget spend in `campaigns.budget_spent`)
 * run inside the same database transaction (see migration 0017).
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type {
  Invoices,
  PaymentTransactions,
  CreatorPayouts,
  Refunds,
  PlatformFeeSettings,
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { InvoiceCreateInput, InvoiceMarkPaidInput, RefundCreateInput } from "@/lib/validations";
import {
  computeSplit,
  getPlatformFeePercentFromEnv,
  getStripeClient,
  isStripeConfigured,
} from "@/lib/payments/stripe";

type Client = any;

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

/**
 * Create an invoice for a collaboration. Brand owner only.
 */
export async function createInvoice(
  input: InvoiceCreateInput,
  client?: Client,
): Promise<ServiceResult<Invoices>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const collaboration = await getCollaborationBrand(supabase, input.collaboration_id);
  if (!collaboration) {
    return fail(Errors.collaborationNotFound());
  }

  const isOwner = await isBrandOwner(supabase, collaboration.brand_id, profileId);
  if (!isOwner && !(await isStaff(supabase, profileId))) {
    return fail(Errors.invoiceNotBrandOwner());
  }

  try {
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        collaboration_id: input.collaboration_id,
        brand_id: collaboration.brand_id,
        creator_profile_id: await getCreatorProfileIdForCollab(supabase, input.collaboration_id),
        invoice_number: input.invoice_number,
        amount: input.amount,
        currency: input.currency,
        status: "draft",
        due_date: input.due_date?.toISOString() ?? null,
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Invoice was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get an invoice by ID (brand owner, creator, staff).
 */
export async function getInvoice(
  invoiceId: string,
  client?: Client,
): Promise<ServiceResult<Invoices | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * List invoices for the current user (as brand owner or creator).
 */
export async function listMyInvoices(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client,
): Promise<ServiceResult<Invoices[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);

  try {
    let query = supabase
      .from("invoices")
      .select("*, collaboration:collaborations(id, status)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (creatorProfileId) {
      // Get brand IDs owned by this profile to avoid raw SQL interpolation.
      const { data: ownedBrands } = await supabase
        .from("brands")
        .select("id")
        .eq("owner_id", profileId);

      const ownedBrandIds = (ownedBrands ?? []).map((b) => b.id);

      query = query.or(
        [`brand_id.in.(${ownedBrandIds.join(",")})`, `creator_profile_id.eq.${creatorProfileId}`].join(","),
      );
    } else {
      // Get brand IDs owned by this profile to avoid raw SQL interpolation.
      const { data: ownedBrands } = await supabase
        .from("brands")
        .select("id")
        .eq("owner_id", profileId);

      const ownedBrandIds = (ownedBrands ?? []).map((b) => b.id);

      if (ownedBrandIds.length > 0) {
        query = query.in("brand_id", ownedBrandIds);
      } else {
        // No brands owned → no invoices visible.
        return ok([]);
      }
    }

    const { data, error } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Mark an invoice as paid (brand owner or staff).
 */
export async function markInvoicePaid(
  input: InvoiceMarkPaidInput,
  client?: Client,
): Promise<ServiceResult<Invoices>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const invoice = await getInvoice(input.invoice_id, supabase);
  if (invoice.error || !invoice.data) {
    return fail(Errors.invoiceNotFound());
  }

  if (invoice.data.status === "paid") {
    return fail(Errors.invoiceAlreadyPaid());
  }

  const isOwner = await isBrandOwner(supabase, invoice.data.brand_id, profileId);
  if (!isOwner && !(await isStaff(supabase, profileId))) {
    return fail(Errors.invoiceNotBrandOwner());
  }

  try {
    const { data, error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", input.invoice_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.invoiceNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Payment transactions (server-side insert only)
// ---------------------------------------------------------------------------

/**
 * Record a payment transaction atomically via the Postgres function
 * `fn_record_payment_transaction` (single DB transaction; the financial state
 * trigger applies platform commission + campaign budget spend).
 * Server-side only (after provider confirmation or for pending checkout state).
 * Idempotent: unique constraint on payment_transactions.idempotency_key.
 */
export async function recordPaymentTransaction(input: {
  collaborationId?: string | null;
  invoiceId?: string | null;
  provider: string;
  providerPaymentId?: string | null;
  idempotencyKey: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded" | "cancelled";
  feeAmount?: number;
  creatorAmount?: number;
  metadata?: Record<string, unknown>;
}): Promise<ServiceResult<PaymentTransactions>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase.rpc("fn_record_payment_transaction", {
      p_collaboration_id: input.collaborationId ?? null,
      p_invoice_id: input.invoiceId ?? null,
      p_provider: input.provider,
      p_provider_payment_id: input.providerPaymentId ?? null,
      p_idempotency_key: input.idempotencyKey,
      p_amount: input.amount,
      p_currency: input.currency,
      p_status: input.status,
      p_metadata: input.metadata ?? {},
    });

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Payment was not recorded."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a payment transaction (parties + staff).
 */
export async function getPaymentTransaction(
  transactionId: string,
  client?: Client,
): Promise<ServiceResult<PaymentTransactions | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", transactionId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Platform commission
// ---------------------------------------------------------------------------

/**
 * Get the current platform commission settings (latest effective row).
 */
export async function getPlatformFeeSettings(
  client?: Client,
): Promise<ServiceResult<PlatformFeeSettings | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("platform_fee_settings")
      .select("*")
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? null);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Effective platform commission rate (fraction, e.g. 0.10) as a fallback when
 * no settings row exists. Read through the service layer (DB) where possible.
 */
export async function getEffectivePlatformFeeRate(client?: Client): Promise<number> {
  const supabase = client ?? getSupabaseClient();
  const settings = await getPlatformFeeSettings(supabase);
  if (settings.data?.rate) return settings.data.rate;
  return getPlatformFeePercentFromEnv() / 100;
}

/**
 * Compute platform fee + creator net amount. Money rounded to 2 decimals.
 */
export function computePlatformFee(amount: number, rateFraction: number): { fee: number; creatorAmount: number } {
  const rate = Number.isFinite(rateFraction) ? Math.min(Math.max(rateFraction, 0), 1) : getPlatformFeePercentFromEnv() / 100;
  return computeSplit(amount, rate);
}

// ---------------------------------------------------------------------------
// Checkout session (brand pays invoice via Stripe Checkout)
// ---------------------------------------------------------------------------

export interface CheckoutSessionInput {
  collaborationId: string;
  invoiceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
  transactionId: string;
}

/**
 * Create a server-side Stripe Checkout Session for an invoice and record a
 * pending payment transaction. Client never confirms payment — the authoritative
 * state change happens in the Stripe webhook handler.
 * Idempotent per invoice: a pending transaction with the same key short-circuits.
 */
export async function createCheckoutSession(
  input: CheckoutSessionInput,
  client?: Client,
): Promise<ServiceResult<CheckoutSessionResult>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (!isStripeConfigured()) {
    return fail(Errors.paymentProviderNotConfigured());
  }

  const invoice = await getInvoice(input.invoiceId, supabase);
  if (invoice.error || !invoice.data) {
    return fail(Errors.invoiceNotFound());
  }

  if (invoice.data.status === "paid") {
    return fail(Errors.invoiceAlreadyPaid());
  }

  const collaboration = await getCollaborationBrand(supabase, input.collaborationId);
  if (!collaboration) {
    return fail(Errors.collaborationNotFound());
  }

  const isOwner = await isBrandOwner(supabase, collaboration.brand_id, profileId);
  if (!isOwner && !(await isStaff(supabase, profileId))) {
    return fail(Errors.invoiceNotBrandOwner());
  }

  const idempotencyKey = `checkout:${input.invoiceId}:${input.collaborationId}`;

  try {
    const { data: existing } = await getSupabaseAdminClient()
      .from("payment_transactions")
      .select("id, status, amount, currency")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      // Idempotent retry: surface the existing transaction instead of creating another.
      return ok({
        checkoutUrl: "",
        sessionId: existing.id,
        transactionId: existing.id,
      });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: invoice.data.currency,
            unit_amount: Math.round((invoice.data.amount ?? 0) * 100),
            product_data: {
              name: `CALLBACX Marketing Campaign Invoice ${invoice.data.invoice_number}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          collaboration_id: input.collaborationId,
          invoice_id: input.invoiceId,
          brand_id: collaboration.brand_id,
          creator_profile_id: invoice.data.creator_profile_id,
          invoice_number: invoice.data.invoice_number,
          amount: invoice.data.amount,
          currency: invoice.data.currency,
        },
      },
      metadata: {
        collaboration_id: input.collaborationId,
        invoice_id: input.invoiceId,
        brand_id: collaboration.brand_id,
        creator_profile_id: invoice.data.creator_profile_id,
        invoice_number: invoice.data.invoice_number,
        amount: invoice.data.amount,
        currency: invoice.data.currency,
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }, { idempotencyKey: `chk_${input.invoiceId}_${input.collaborationId}` });

    const { data: txn, error: txnError } = await getSupabaseAdminClient()
      .rpc("fn_record_payment_transaction", {
        p_collaboration_id: input.collaborationId,
        p_invoice_id: input.invoiceId,
        p_provider: "stripe",
        p_provider_payment_id: session.id,
        p_idempotency_key: idempotencyKey,
        p_amount: invoice.data.amount,
        p_currency: invoice.data.currency,
        p_status: "pending",
        p_metadata: { checkout_session_id: session.id, invoice_number: invoice.data.invoice_number },
      });

    if (txnError) return fail(mapSupabaseError(txnError));
    if (!txn) return fail(Errors.internal("Payment was not recorded."));

    return ok({ checkoutUrl: session.url ?? "", sessionId: session.id, transactionId: txn.id });
  } catch (error) {
    // Surface provider misconfiguration distinctly.
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("not configured") || message.includes("No API key")) {
      return fail(Errors.paymentProviderNotConfigured());
    }
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Transaction history
// ---------------------------------------------------------------------------

export interface PaymentTransactionFilters {
  limit?: number;
  offset?: number;
  status?: string;
  provider?: string;
  search?: string;
  brandId?: string;
  creatorProfileId?: string;
  collaborationId?: string;
}

/**
 * List payment transactions with optional filters (admin / brand / creator).
 */
export async function listPaymentTransactions(
  filters: PaymentTransactionFilters = {},
  client?: Client,
): Promise<ServiceResult<PaymentTransactions[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    let query = supabase
      .from("payment_transactions")
      .select(
        "*, collaboration:collaborations(id, status, brand_id, creator_profile_id, campaign_id), invoice:invoices(id, invoice_number, status, amount, currency)",
      )
      .order("created_at", { ascending: false })
      .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 20) - 1);

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.provider) query = query.eq("provider", filters.provider);
    if (filters.collaborationId) query = query.eq("collaboration_id", filters.collaborationId);

    if (filters.brandId) {
      query = query.eq("collaboration.brand_id", filters.brandId);
    }
    if (filters.creatorProfileId) {
      query = query.eq("collaboration.creator_profile_id", filters.creatorProfileId);
    }
    if (filters.search) {
      // Validate search string to prevent SQL injection via .or() filter interpolation.
      // Only allow alphanumeric, hyphens, underscores, and dots (safe for UUIDs and payment IDs).
      if (!/^[A-Za-z0-9\-_.]+$/.test(filters.search)) {
        return fail(Errors.validationFailed("Search contains invalid characters."));
      }
      const safeSearch = filters.search.replace(/'/g, "''");
      query = query.or(`id.like.%${safeSearch}%,provider_payment_id.ilike.%${safeSearch}%`);
    }

    const { data, error } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Webhook event idempotency
// ---------------------------------------------------------------------------

export async function getPaymentWebhookEvent(
  provider: string,
  eventId: string,
  client?: Client,
): Promise<ServiceResult<{ processed: boolean } | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("payment_webhook_events")
      .select("processed")
      .eq("provider", provider)
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? null);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Mark a provider webhook event as processed (idempotent ingestion guard).
 */
export async function markPaymentWebhookEventProcessed(
  provider: string,
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<ServiceResult<{ processed: boolean }>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("payment_webhook_events")
      .insert({
        provider,
        event_id: eventId,
        event_type: eventType,
        payload,
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .select("processed")
      .single();

    if (error) {
      // Unique (provider, event_id) violation → duplicate webhook: already handled.
      if ((error as { code?: string }).code === "23505") {
        return ok({ processed: true });
      }
      return fail(mapSupabaseError(error));
    }
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/**
 * Create a refund request (staff only). Provider execution happens via
 * processRefund after approval.
 */
export async function createRefund(
  input: RefundCreateInput,
  client?: Client,
): Promise<ServiceResult<Refunds>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (!(await isStaff(supabase, profileId))) {
    return fail(Errors.refundNotStaff());
  }

  const txn = await getPaymentTransaction(input.payment_transaction_id, supabase);
  if (txn.error || !txn.data) {
    return fail(Errors.paymentNotFound());
  }

  try {
    const { data, error } = await supabase
      .from("refunds")
      .insert({
        payment_transaction_id: input.payment_transaction_id,
        amount: input.amount,
        currency: input.currency,
        reason: input.reason ?? null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Refund was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Approve a refund (staff only).
 */
export async function approveRefund(
  refundId: string,
  client?: Client,
): Promise<ServiceResult<Refunds>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }
  if (!(await isStaff(supabase, profileId))) {
    return fail(Errors.refundNotStaff());
  }

  const refund = await getRefundById(refundId, supabase);
  if (refund.error || !refund.data) {
    return fail(Errors.refundNotFound());
  }
  if (refund.data.status !== "pending") {
      return fail(Errors.refundInvalidStatus(refund.data.status));
  }

  try {
    const { data, error } = await supabase
      .from("refunds")
      .update({ status: "approved" })
      .eq("id", refundId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.refundNotFound());
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

async function getRefundById(refundId: string, supabase: Client) {
  const { data, error } = await supabase
    .from("refunds")
    .select("*")
    .eq("id", refundId)
    .maybeSingle();
  return { data: data as Refunds | null, error };
}

/**
 * Execute a refund through the payment provider (Stripe Refund) and mark the
 * originating payment transaction as refunded / partially refunded.
 * Staff only. Called after a refund is approved.
 */
export async function processRefund(input: {
  refundId: string;
  providerRefundId?: string | null;
}): Promise<ServiceResult<Refunds>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data: refund, error: refundError } = await supabase
      .from("refunds")
      .select("*")
      .eq("id", input.refundId)
      .maybeSingle();

    if (refundError) return fail(mapSupabaseError(refundError));
    if (!refund) return fail(Errors.refundNotFound());

    if (refund.status !== "approved") {
      return fail(Errors.refundNotApproved());
    }

    if (!isStripeConfigured()) {
      return fail(Errors.paymentProviderNotConfigured());
    }

    const stripe = getStripeClient();

    const providerRefund = await stripe.refunds.create({
      payment_intent: refund.payment_transaction_id ?? undefined,
      amount: Math.round((refund.amount ?? 0) * 100),
    });

    const { data: updated, error: updateError } = await supabase
      .from("refunds")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        provider_refund_id: providerRefund.id,
      })
      .eq("id", refund.id)
      .select("*")
      .single();

    if (updateError) return fail(mapSupabaseError(updateError));
    if (!updated) return fail(Errors.internal("Refund was not updated."));

    const { data: txn } = await supabase
      .from("payment_transactions")
      .select("id, amount, currency, status, collaboration_id, invoice_id")
      .eq("id", refund.payment_transaction_id)
      .maybeSingle();

    if (txn) {
      const isFullRefund = (txn.amount ?? 0) - (refund.amount ?? 0) <= 0;
      const newStatus = isFullRefund ? "refunded" : "partially_refunded";
      await supabase
        .from("payment_transactions")
        .update({ status: newStatus })
        .eq("id", txn.id);
    }

    return ok(updated);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Creator payouts
// ---------------------------------------------------------------------------

/**
 * List creator payouts for the current creator profile.
 */
export async function listMyPayouts(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client,
): Promise<ServiceResult<CreatorPayouts[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);
  if (!creatorProfileId) {
    return fail(Errors.creatorProfileNotFound());
  }

  try {
    const { data, error } = await supabase
      .from("creator_payouts")
      .select("*, payment_transaction:payment_transactions(id, provider, status)")
      .eq("creator_profile_id", creatorProfileId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Create a creator payout (staff initiates; creator may request from balance).
 */
export async function createPayout(
  input: { creatorProfileId: string; paymentTransactionId?: string | null; amount: number; currency: string },
  client?: Client,
): Promise<ServiceResult<CreatorPayouts>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);
  const isStaffUser = await isStaff(supabase, profileId);
  const isSelfPayout = creatorProfileId === input.creatorProfileId;

  if (!isStaffUser && !isSelfPayout) {
    return fail(Errors.refundNotStaff());
  }

  try {
    const { data, error } = await supabase
      .from("creator_payouts")
      .insert({
        creator_profile_id: input.creatorProfileId,
        payment_transaction_id: input.paymentTransactionId ?? null,
        amount: input.amount,
        currency: input.currency,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Payout was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Mark a creator payout as paid (staff). Records provider payout reference.
 */
export async function processPayout(
  input: { payoutId: string; providerPayoutId?: string | null; processedBy?: string | null },
): Promise<ServiceResult<CreatorPayouts>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("creator_payouts")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        provider_payout_id: input.providerPayoutId ?? null,
        processed_by: input.processedBy ?? null,
      })
      .eq("id", input.payoutId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Payout was not updated."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Campaign budget tracking
// ---------------------------------------------------------------------------

/**
 * Get campaign budget consumed vs allocated.
 */
export async function getCampaignBudget(
  campaignId: string,
  client?: Client,
): Promise<ServiceResult<{
  campaignId: string;
  budgetTotal: number;
  budgetSpent: number;
  budgetCurrency: string;
  spent: number;
  remaining: number;
  utilization: number;
}>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, budget_total, budget_spent, budget_currency, status")
      .eq("id", campaignId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    if (!data) {
      return fail(Errors.campaignNotFound());
    }

    const spent = data.budget_spent ?? 0;
    const budgetTotal = data.budget_total ?? 0;
    const remaining = Math.round((budgetTotal - spent) * 100) / 100;
    const utilization = budgetTotal > 0 ? spent / budgetTotal : 0;

    return ok({
      campaignId: data.id,
      budgetTotal,
      budgetSpent: spent,
      budgetCurrency: data.budget_currency ?? "USD",
      spent,
      remaining,
      utilization,
    });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Admin financial dashboard
// ---------------------------------------------------------------------------

export interface FinancialDashboardStats {
  total_volume: number;
  net_revenue: number;
  total_fees: number;
  total_refunds: number;
  creator_payouts_paid: number;
  pending_payouts: number;
  transaction_count: number;
  succeeded_count: number;
  pending_count: number;
  failed_count: number;
  refunded_count: number;
  cancelled_count: number;
  revenue_last_7d: number;
  revenue_last_30d: number;
  success_rate: number;
}

/**
 * Aggregated financial dashboard stats (admin / staff).
 */
export async function getFinancialDashboardStats(client?: Client): Promise<ServiceResult<FinancialDashboardStats>> {
  const supabase = client ?? getSupabaseAdminClient();

  try {
    const { data: transactions, error } = await supabase
      .from("payment_transactions")
      .select("id, amount, currency, status, fee_amount, creator_amount");

    if (error) return fail(mapSupabaseError(error));

    const txs: any[] = transactions ?? [];
    const succeeded = txs.filter((t) => t.status === "succeeded");
    const refunded = txs.filter((t) => t.status === "refunded" || t.status === "partially_refunded");

    const totalVolume = succeeded.reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const totalFees = succeeded.reduce((sum, t) => sum + (t.fee_amount ?? 0), 0);
    const totalCreatorNet = succeeded.reduce((sum, t) => sum + (t.creator_amount ?? 0), 0);
    const totalRefunds = refunded.reduce((sum, t) => sum + (t.amount ?? 0), 0);

    const now = new Date();
    const startOf7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOf30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const revenueLast7d = succeeded
      .filter((t) => new Date(t.created_at) >= startOf7d)
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const revenueLast30d = succeeded
      .filter((t) => new Date(t.created_at) >= startOf30d)
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);

    const succeededCount = succeeded.length;
    const successRate = txs.length > 0 ? (succeededCount / txs.length) * 100 : 0;

    const { data: payouts, error: payoutsError } = await supabase
      .from("creator_payouts")
      .select("id, amount, status");

    if (payoutsError) return fail(mapSupabaseError(payoutsError));

    const paidPayouts: any[] = (payouts ?? []).filter((p: any) => p.status === "paid");
    const pendingPayouts: any[] = (payouts ?? []).filter((p: any) => p.status === "pending");

    const creatorPayoutsPaid = paidPayouts.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const pendingPayoutTotal = pendingPayouts.reduce((sum, p) => sum + (p.amount ?? 0), 0);

    const netRevenue = Math.round(((totalVolume - totalRefunds) - totalFees) * 100) / 100;

    return ok({
      total_volume: Math.round(totalVolume * 100) / 100,
      net_revenue: netRevenue,
      total_fees: Math.round(totalFees * 100) / 100,
      total_refunds: Math.round(totalRefunds * 100) / 100,
      creator_payouts_paid: Math.round(creatorPayoutsPaid * 100) / 100,
      pending_payouts: Math.round(pendingPayoutTotal * 100) / 100,
      transaction_count: txs.length,
      succeeded_count: succeededCount,
      pending_count: txs.filter((t) => t.status === "pending").length,
      failed_count: txs.filter((t) => t.status === "failed").length,
      refunded_count: txs.filter((t) => t.status === "refunded").length,
      cancelled_count: txs.filter((t) => t.status === "cancelled").length,
      revenue_last_7d: Math.round(revenueLast7d * 100) / 100,
      revenue_last_30d: Math.round(revenueLast30d * 100) / 100,
      success_rate: Math.round(successRate * 100) / 100,
    });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Reconciliation report
// ---------------------------------------------------------------------------

export interface ReconciliationReport {
  from: string;
  to: string;
  transaction_count: number;
  gross_volume: number;
  total_fees: number;
  creator_net: number;
  refunds_total: number;
  net_revenue: number;
  payouts_paid: number;
  open_payouts: number;
  succeeded_without_payout: number;
  refund_without_processed: number;
}

/**
 * Financial reconciliation report: provider-confirmed transactions vs recorded
 * refunds and creator payouts within a date window.
 */
export async function getReconciliationReport(input: {
  from?: string;
  to?: string;
}): Promise<ServiceResult<ReconciliationReport>> {
  const supabase = getSupabaseAdminClient();

  try {
    const from = input.from ? new Date(input.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = input.to ? new Date(input.to) : new Date();

    const { data: transactions, error } = await supabase
      .from("payment_transactions")
      .select("id, amount, currency, status, fee_amount, creator_amount, created_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString());

    if (error) return fail(mapSupabaseError(error));

    const txs: any[] = (transactions ?? []).filter(
      (t: any) => t.status === "succeeded" || t.status === "refunded" || t.status === "partially_refunded",
    );

    const grossVolume = txs.filter((t: any) => t.status === "succeeded").reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
    const totalFees = txs.filter((t: any) => t.status === "succeeded").reduce((s: number, t: any) => s + (t.fee_amount ?? 0), 0);
    const creatorNet = txs.filter((t: any) => t.status === "succeeded").reduce((s: number, t: any) => s + (t.creator_amount ?? 0), 0);
    const refundsTotal = txs
      .filter((t: any) => t.status === "refunded" || t.status === "partially_refunded")
      .reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
    const netRevenue = Math.round(((grossVolume - refundsTotal) - totalFees) * 100) / 100;

    const { data: payouts, error: payoutsError } = await supabase
      .from("creator_payouts")
      .select("id, amount, status, created_at");

    if (payoutsError) return fail(mapSupabaseError(payoutsError));

    const paidPayouts: any[] = (payouts ?? []).filter((p: any) => p.status === "paid");
    const openPayouts: any[] = (payouts ?? []).filter((p: any) => p.status === "pending");

    const payoutsPaid = paidPayouts.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

    const succeededWithoutPayout = txs.filter(
      (t: any) => t.status === "succeeded" && !paidPayouts.some((p: any) => p.payment_transaction_id === t.id),
    ).length;

    const { data: refunds, error: refundsError } = await supabase
      .from("refunds")
      .select("id, status, processed");

    if (refundsError) return fail(mapSupabaseError(refundsError));

    const refundWithoutProcessed: number = (refunds ?? []).filter(
      (r: any) => r.status !== "processed",
    ).length;

    return ok({
      from: from.toISOString(),
      to: to.toISOString(),
      transaction_count: txs.length,
      gross_volume: Math.round(grossVolume * 100) / 100,
      total_fees: Math.round(totalFees * 100) / 100,
      creator_net: Math.round(creatorNet * 100) / 100,
      refunds_total: Math.round(refundsTotal * 100) / 100,
      net_revenue: netRevenue,
      payouts_paid: Math.round(payoutsPaid * 100) / 100,
      open_payouts: openPayouts.length,
      succeeded_without_payout: succeededWithoutPayout,
      refund_without_processed: refundWithoutProcessed,
    });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Webhook outcome application (idempotent, server-side only)
// ---------------------------------------------------------------------------

/**
 * Apply a provider webhook outcome to the internal financial records.
 * Idempotent: re-delivering the same provider payment id (or event) is a no-op.
 * On success the linked invoice is marked paid.
 */
export async function applyPaymentWebhookOutcome(input: {
  provider: string;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status:
    | "pending"
    | "succeeded"
    | "failed"
    | "refunded"
    | "partially_refunded"
    | "cancelled";
  providerPaymentId: string;
  amount: number;
  currency: string;
  collaborationId?: string | null;
  invoiceId?: string | null;
}): Promise<ServiceResult<{ recorded: boolean }>> {
  const supabase = getSupabaseAdminClient();

  // Idempotent ingestion guard.
  const event = await markPaymentWebhookEventProcessed(
    input.provider,
    input.eventId,
    input.eventType,
    input.payload,
  );
  if (event.error) return fail(event.error);
  if (!event.data?.processed) {
    // Race: another worker processed it first.
    return ok({ recorded: false });
  }

  const { data: existingByPayment, error: existingError } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("provider", input.provider)
    .eq("provider_payment_id", input.providerPaymentId)
    .maybeSingle();

  if (existingError) return fail(mapSupabaseError(existingError));

  let existing: any = existingByPayment;

  // Fallback: resolve an existing transaction via the invoice link so that
  // provider event sequencing (e.g. checkout.session.completed followed by
  // payment_intent.succeeded, or payment_intent.refunded) maps to the same row.
  if (!existing && input.invoiceId) {
    const { data: byInvoice, error: byInvoiceError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("provider", input.provider)
      .eq("invoice_id", input.invoiceId)
      .order("created_at", { ascending: false })
      .limit(2);
    if (byInvoiceError) return fail(mapSupabaseError(byInvoiceError));
    existing = byInvoice && byInvoice.length > 0 ? byInvoice[0] : null;
  }

  let recorded: boolean;

  if (existing) {
    recorded = true;
    if (existing.status !== input.status) {
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updateError) return fail(mapSupabaseError(updateError));
    }
  } else {
    recorded = true;
    const { error: insertError } = await supabase
      .from("payment_transactions")
      .insert({
        collaboration_id: input.collaborationId ?? null,
        invoice_id: input.invoiceId ?? null,
        provider: input.provider,
        provider_payment_id: input.providerPaymentId,
        idempotency_key: `stripe_${input.providerPaymentId}`,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        metadata: input.payload,
      });
    if (insertError) return fail(mapSupabaseError(insertError));
  }

  // Successful payment → mark the invoice paid.
  if (input.status === "succeeded" && input.invoiceId) {
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", input.invoiceId);
    if (invoiceError) {
      // Financial transaction is authoritative; invoice flag is best-effort.
      console.error("[payments] Failed to mark invoice paid", { invoiceId: input.invoiceId, error: invoiceError });
    }
  }

  return ok({ recorded });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data?.id ?? null;
}

async function getCreatorProfileIdForProfile(
  supabase: Client,
  profileId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .is("deleted_at", null)
    .maybeSingle();

  return data?.id ?? null;
}

async function getCollaborationBrand(
  supabase: Client,
  collaborationId: string,
): Promise<{ brand_id: string } | null> {
  const { data } = await supabase
    .from("collaborations")
    .select("brand_id")
    .eq("id", collaborationId)
    .maybeSingle();

  return data ?? null;
}

async function getCreatorProfileIdForCollab(
  supabase: Client,
  collaborationId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("collaborations")
    .select("creator_profile_id")
    .eq("id", collaborationId)
    .maybeSingle();

  return data?.creator_profile_id ?? null;
}

async function isBrandOwner(
  supabase: Client,
  brandId: string,
  profileId: string,
): Promise<boolean> {
  const { data } = await supabase.rpc("is_brand_owner", { p_brand: brandId, p_profile: profileId });
  return data === true;
}

async function isStaff(
  supabase: Client,
  profileId: string,
): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}
