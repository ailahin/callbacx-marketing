/**
 * CALLBACX TECHNOLOGY — Payments service
 *
 * Invoices, payment transactions, payouts, and refunds.
 * - Invoices: brand owner creates; creator reads.
 * - Payment transactions: inserted server-side only (after provider confirmation).
 * - Refunds: staff only.
 * Money uses numeric (never float). No card data ever stored.
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
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { InvoiceCreateInput, InvoiceMarkPaidInput, RefundCreateInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

/**
 * Create an invoice for a collaboration. Brand owner only.
 */
export async function createInvoice(
  input: InvoiceCreateInput,
  client?: Client
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
  client?: Client
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
  client?: Client
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
      query = query.or(`brand_id.in.(select id from brands where owner_id = '${profileId}'),creator_profile_id.eq.${creatorProfileId}`);
    } else {
      query = query.eq("brand_id", "(select id from brands where owner_id = '${profileId}')");
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
  client?: Client
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
 * Record a payment transaction. Server-side only (after provider confirmation).
 * Caller should be a server route/webhook handler using the admin client.
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
    const { data, error } = await supabase
      .from("payment_transactions")
      .insert({
        collaboration_id: input.collaborationId ?? null,
        invoice_id: input.invoiceId ?? null,
        provider: input.provider,
        provider_payment_id: input.providerPaymentId ?? null,
        idempotency_key: input.idempotencyKey,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        fee_amount: input.feeAmount ?? 0,
        creator_amount: input.creatorAmount ?? 0,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

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
  client?: Client
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
// Refunds (staff only)
// ---------------------------------------------------------------------------

/**
 * Create a refund. Staff only.
 */
export async function createRefund(
  input: RefundCreateInput,
  client?: Client
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

// ---------------------------------------------------------------------------
// Creator payouts
// ---------------------------------------------------------------------------

/**
 * List payouts for the current creator profile.
 */
export async function listMyPayouts(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client
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
  profileId: string
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
  collaborationId: string
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
  collaborationId: string
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
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_brand_owner", { p_brand: brandId, p_profile: profileId });
  return data === true;
}

async function isStaff(
  supabase: Client,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}


