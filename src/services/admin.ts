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
import type { AdminActivityLogs } from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { AdminActivityLogInput } from "@/lib/validations";

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


