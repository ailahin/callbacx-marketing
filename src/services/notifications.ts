/**
 * CALLBACX MARKETING — Notification service
 *
 * User notifications: read own notifications, mark as read, update
 * preferences. Inserts are server-side only (no client insert policy on
 * notifications) — triggered by service functions.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { Notifications, NotificationPreferences } from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { NotificationPreferenceInput } from "@/lib/validations";
import { getSupabaseAdminClient } from "@/lib/supabase/client";

type Client = any;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/**
 * List notifications for the current user, newest first.
 * RLS: notifications_read_own (auth.uid() = recipient_id).
 */
export async function listNotifications(
  { limit = 20, offset = 0, unreadOnly = false }: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
  client?: Client
): Promise<ServiceResult<Notifications[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", profileId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.is("read_at", null);
    }

    const { data, error } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a single notification (recipient only).
 */
export async function getNotification(
  notificationId: string,
  client?: Client
): Promise<ServiceResult<Notifications | null>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .eq("recipient_id", profileId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Mark a notification as read (recipient only).
 */
export async function markNotificationRead(
  notificationId: string,
  client?: Client
): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient_id", profileId);

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Mark all notifications as read (recipient only).
 */
export async function markAllNotificationsRead(client?: Client): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", profileId)
      .is("read_at", null);

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get unread count for the current user.
 */
export async function getUnreadCount(client?: Client): Promise<ServiceResult<number>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { head: true, count: "exact" })
      .eq("recipient_id", profileId)
      .is("read_at", null);

    if (error) return fail(mapSupabaseError(error));
    return ok(count ?? 0);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

/**
 * Get the current user's notification preferences.
 */
export async function getNotificationPreferences(client?: Client): Promise<ServiceResult<NotificationPreferences | null>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update the current user's notification preferences.
 */
export async function updateNotificationPreferences(
  input: NotificationPreferenceInput,
  client?: Client
): Promise<ServiceResult<NotificationPreferences>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({
        profile_id: profileId,
        email_enabled: input.email_enabled ?? true,
        push_enabled: input.push_enabled ?? true,
        categories: input.categories ?? {},
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Preferences were not saved."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Server-side: create a notification (used by other services)
// ---------------------------------------------------------------------------

/**
 * Create a notification for a recipient. Intended for server-side use only
 * (no client insert policy exists on notifications).
 */
export async function createNotificationServerSide(input: {
  recipientId: string;
  actorId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown>;
}): Promise<ServiceResult<Notifications>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        recipient_id: input.recipientId,
        actor_id: input.actorId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        data: input.data ?? {},
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Notification was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  return getCachedProfileId(supabase);
}


