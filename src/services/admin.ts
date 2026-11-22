/**
 * CALLBACX TECHNOLOGY — Admin service
 *
 * Admin activity logs and privileged platform operations.
 * All writes are staff-only (RLS: is_staff). Activity logs are append-only
 * (trigger blocks updates/deletes).
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { AdminActivityLogs, PaymentTransactions } from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { AdminActivityLogInput, AdminPaymentListInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Activity logs
// ---------------------------------------------------------------------------

/**
 * List admin activity logs. Staff only.
 */
export async function listActivityLogs(
  {
    limit = 50,
    offset = 0,
    adminId,
    action,
  }: {
    limit?: number;
    offset?: number;
    adminId?: string;
    action?: string;
  } = {},
  client?: Client
): Promise<ServiceResult<AdminActivityLogs[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (!(await isStaff(supabase, profileId))) {
    return fail(Errors.adminNotStaff());
  }

  try {
    let query = supabase
      .from("admin_activity_logs")
      .select("*, admin:profiles(id, full_name)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (adminId) {
      query = query.eq("admin_id", adminId);
    }
    if (action) {
      query = query.ilike("action", `%${action}%`);
    }

    const { data, error } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Create an activity log entry. Staff only. Append-only (server-side).
 */
export async function createActivityLog(
  input: AdminActivityLogInput,
  client?: Client
): Promise<ServiceResult<AdminActivityLogs>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (!(await isStaff(supabase, profileId))) {
    return fail(Errors.adminNotStaff());
  }

  try {
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .insert({
        admin_id: profileId,
        action: input.action,
        target_type: input.target_type,
        target_id: input.target_id ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Activity log was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Server-side activity log (admin client). Used by privileged operations
 * where the actor is known but may not have a normal session context.
 */
export async function createActivityLogServerSide(input: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<ServiceResult<AdminActivityLogs>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .insert({
        admin_id: input.adminId,
        action: input.action,
        target_type: input.targetType,
        target_id: input.targetId ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Activity log was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Payments / transactions
// ---------------------------------------------------------------------------

/**
 * List payment transactions for the admin financial monitoring screen.
 * Supports search / status / provider / date-range filters and pagination.
 */
export async function listAdminPayments(
  input: AdminPaymentListInput,
): Promise<ServiceResult<{ payments: PaymentTransactions[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, status, provider, start_date, end_date, limit, offset } = input;

  const from = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = end_date ? new Date(end_date) : new Date();

  let query = supabase
    .from("payment_transactions")
    .select(
      "*, collaboration:collaborations(id, status, brand_id, creator_profile_id, campaign_id), invoice:invoices(id, invoice_number, status, amount, currency)",
    )
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());

  if (status) query = query.eq("status", status);
  if (provider) query = query.eq("provider", provider);
  if (search) {
    query = query.or(`id.like.%${search}%,provider_payment_id.like.%${search},provider.like.%${search}%`);
  }

  const { data, error, count } = await query.range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1);

  if (error) return fail(mapSupabaseError(error));

  return ok({
    payments: (data ?? []) as PaymentTransactions[],
    total: count ?? (data ?? []).length,
  });
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

async function isStaff(
  supabase: Client,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}


