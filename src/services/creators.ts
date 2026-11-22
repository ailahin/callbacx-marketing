/**
 * CALLBACX TECHNOLOGY — Creator service
 *
 * Creator profile management, social accounts, portfolio/media, rates,
 * and public discovery with filtering. Creator writes are owner-only via RLS.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type {
  CreatorProfiles,
  CreatorSocialAccounts,
  CreatorPortfolios,
  CreatorMedia,
  CreatorRates,
  CreatorCategories,
  CreatorNiches,
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type {
  CreatorProfileCreateInput,
  CreatorProfileUpdateInput,
  CreatorSocialAccountInput,
  CreatorRateInput,
} from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Creator profile (owner + public read)
// ---------------------------------------------------------------------------

/**
 * Get the current user's creator profile (null if they don't have one).
 */
export async function getMyCreatorProfile(
  client?: Client
): Promise<ServiceResult<CreatorProfiles | null>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("creator_profiles")
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
 * Get a creator profile by ID (public read for active profiles).
 */
export async function getCreatorProfile(
  id: string,
  client?: Client
): Promise<ServiceResult<CreatorProfiles | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Create the current user's creator profile. One per profile.
 * RLS: creator_profiles_insert_owner (is_creator_profile_owner).
 */
export async function createCreatorProfile(
  input: CreatorProfileCreateInput,
  client?: Client
): Promise<ServiceResult<CreatorProfiles>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .insert({
        profile_id: profileId,
        display_name: input.display_name,
        bio: input.bio ?? null,
        location: input.location ?? {},
        languages: input.languages ?? [],
        contact_email: input.contact_email ?? null,
        website_url: input.website_url ?? null,
        availability_status: input.availability_status ?? "open",
        collaboration_preferences: input.collaboration_preferences ?? {},
        verification_status: "pending",
        is_active: true,
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Creator profile was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update the current user's creator profile.
 * RLS: creator_profiles_update_owner.
 */
export async function updateMyCreatorProfile(
  creatorProfileId: string,
  input: CreatorProfileUpdateInput,
  client?: Client
): Promise<ServiceResult<CreatorProfiles>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const existing = await getCreatorProfile(creatorProfileId, supabase);
  if (existing.error || !existing.data) {
    return fail(Errors.creatorProfileNotFound());
  }
  if (existing.data.profile_id !== profileId) {
    return fail(Errors.creatorProfileNotOwner());
  }

  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .update(input)
      .eq("id", creatorProfileId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.creatorProfileNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Public discovery + filtering
// ---------------------------------------------------------------------------

interface ListCreatorsParams {
  limit?: number;
  offset?: number;
  categoryId?: string;
  nicheId?: string;
  availability?: string;
  verificationStatus?: string;
  search?: string;
}

/**
 * List public creator profiles with optional filtering.
 * Used for creator discovery. RLS allows public read of active profiles.
 */
export async function listPublicCreators(
  params: ListCreatorsParams = {},
  client?: Client
): Promise<ServiceResult<CreatorProfiles[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    let query = supabase
      .from("creator_profiles")
      .select("*, creator_profile_categories(creator_category_id), creator_profile_niches(creator_niche_id)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (params.categoryId) {
      query = query.eq("creator_profile_categories.creator_category_id", params.categoryId);
    }
    if (params.nicheId) {
      query = query.eq("creator_profile_niches.creator_niche_id", params.nicheId);
    }
    if (params.availability) {
      query = query.eq("availability_status", params.availability);
    }
    if (params.verificationStatus) {
      query = query.eq("verification_status", params.verificationStatus);
    }
    if (params.search) {
      query = query.ilike("display_name", `%${params.search}%`);
    }

    query = query.range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 20) - 1);

    const { data, error } = await query;

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Social accounts
// ---------------------------------------------------------------------------

/**
 * List social accounts for a creator profile (public read).
 */
export async function listSocialAccounts(
  creatorProfileId: string,
  client?: Client
): Promise<ServiceResult<CreatorSocialAccounts[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("creator_social_accounts")
      .select("*")
      .eq("creator_profile_id", creatorProfileId)
      .order("platform", { ascending: true });

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Add a social account to the current user's creator profile.
 * RLS: creator_social_accounts_write_owner.
 */
export async function addSocialAccount(
  creatorProfileId: string,
  input: CreatorSocialAccountInput,
  client?: Client
): Promise<ServiceResult<CreatorSocialAccounts>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const existing = await getCreatorProfile(creatorProfileId, supabase);
  if (existing.error || !existing.data) {
    return fail(Errors.creatorProfileNotFound());
  }
  if (existing.data.profile_id !== profileId) {
    return fail(Errors.creatorProfileNotOwner());
  }

  try {
    const { data, error } = await supabase
      .from("creator_social_accounts")
      .insert({
        creator_profile_id: creatorProfileId,
        platform: input.platform,
        username: input.username,
        profile_url: input.profile_url ?? null,
        platform_user_id: input.platform_user_id ?? null,
        is_verified: false,
        metrics_source: "manual",
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Social account was not added."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

/**
 * List the current user's creator rates (owner only).
 */
export async function listRates(
  creatorProfileId: string,
  client?: Client
): Promise<ServiceResult<CreatorRates[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const existing = await getCreatorProfile(creatorProfileId, supabase);
  if (existing.error || !existing.data || existing.data.profile_id !== profileId) {
    return fail(Errors.creatorProfileNotOwner());
  }

  try {
    const { data, error } = await supabase
      .from("creator_rates")
      .select("*")
      .eq("creator_profile_id", creatorProfileId)
      .order("service_type", { ascending: true });

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Upsert a rate for the current user's creator profile.
 */
export async function upsertRate(
  creatorProfileId: string,
  input: CreatorRateInput,
  client?: Client
): Promise<ServiceResult<CreatorRates>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const existing = await getCreatorProfile(creatorProfileId, supabase);
  if (existing.error || !existing.data || existing.data.profile_id !== profileId) {
    return fail(Errors.creatorProfileNotOwner());
  }

  if (input.min_rate > input.max_rate) {
    return fail(Errors.validationFailed("Minimum rate cannot exceed maximum rate."));
  }

  try {
    const { data, error } = await supabase
      .from("creator_rates")
      .upsert({
        creator_profile_id: creatorProfileId,
        service_type: input.service_type,
        min_rate: input.min_rate,
        max_rate: input.max_rate,
        currency: input.currency,
      }, { onConflict: "creator_profile_id,service_type" })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Rate was not saved."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Categories & niches (reference data, public read)
// ---------------------------------------------------------------------------

export async function listCreatorCategories(client?: Client): Promise<ServiceResult<CreatorCategories[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("creator_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

export async function listCreatorNiches(
  categoryId?: string,
  client?: Client
): Promise<ServiceResult<CreatorNiches[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    let query = supabase.from("creator_niches").select("*").order("name", { ascending: true });
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;
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


