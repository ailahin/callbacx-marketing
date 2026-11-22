/**
 * CALLBACX TECHNOLOGY — Profile service
 *
 * Secure profile management: read/update public profile, read private
 * profile data (owner only). All operations rely on RLS; the caller's
 * auth.uid() is the identity — we never trust client-supplied user IDs.
 *
 * Accepts an optional `client` parameter so route handlers can pass a
 * cookie-bound server client; otherwise `getSupabaseClient()` is used.
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { Profiles, ProfilePrivate } from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { ProfileUpdateInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Public profile
// ---------------------------------------------------------------------------

/**
 * Get the current user's public profile.
 * RLS: profiles_own_read (auth.uid() = auth_user_id).
 */
export async function getMyProfile(
  client?: Client
): Promise<ServiceResult<Profiles | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const authId = await getCurrentAuthId(supabase);
    if (!authId) {
      return ok(null);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a public profile by ID (readable if public, or by owner/staff).
 */
export async function getProfileById(
  profileId: string,
  client?: Client
): Promise<ServiceResult<Profiles | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update the current user's public profile.
 * RLS: profiles_own_update (auth.uid() = auth_user_id).
 */
export async function updateMyProfile(
  input: ProfileUpdateInput,
  client?: Client
): Promise<ServiceResult<Profiles>> {
  const supabase = client ?? getSupabaseClient();
  const authId = await getCurrentAuthId(supabase);

  if (!authId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(input)
      .eq("id", authId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.profileNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Private profile (owner only)
// ---------------------------------------------------------------------------

/**
 * Get the current user's private profile data.
 * RLS: profile_private_owner (only the profile owner can read).
 */
export async function getMyPrivateProfile(
  client?: Client
): Promise<ServiceResult<ProfilePrivate | null>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("profile_private")
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
 * Update the current user's private profile data.
 * RLS: profile_private_owner.
 */
export async function updateMyPrivateProfile(
  patch: Partial<Pick<ProfilePrivate, "phone" | "date_of_birth" | "address" | "id_document_url">>,
  client?: Client
): Promise<ServiceResult<ProfilePrivate>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("profile_private")
      .upsert({ profile_id: profileId, ...patch, updated_at: new Date().toISOString() })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.profileNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentAuthId(supabase: Client): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  const authId = await getCurrentAuthId(supabase);
  if (!authId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authId)
    .maybeSingle();

  return data?.id ?? null;
}
