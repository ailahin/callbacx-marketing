/**
 * CALLBACX MARKETING — Creator service
 *
 * Creator profile management, social accounts, portfolio/media, rates,
 * and public discovery with filtering. Creator writes are owner-only via RLS.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  MediaKind,
  VerificationStatus,
  CollaborationInvitations,
} from "@/lib/supabase/types/database";
import type {
  CreatorProfiles,
  CreatorSocialAccounts,
  CreatorPortfolios,
  CreatorMedia,
  CreatorRates,
  CreatorCategories,
  CreatorNiches,
  CreatorAudienceDemographics,
  CreatorCollections,
  CreatorCollectionItems,
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
  ListCreatorsInput,
  MatchingCriteriaInput,
  CollectionCreateInput,
  CollectionUpdateInput,
  FavoriteToggleInput,
  CollectionItemInput,
  CollaborationInvitationInput,
} from "@/lib/validations";
import { parseZodError, AUDIENCE_SIZE_BOUNDS, listCreatorsSchema } from "@/lib/validations";

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
  return getCachedProfileId(supabase);
}

// ---------------------------------------------------------------------------
// Discovery types
// ---------------------------------------------------------------------------

export interface PaginatedCreatorResult {
  creators: CreatorListItem[];
  count: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CreatorListItem {
  id: string;
  profile_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: Json;
  languages: string[];
  contact_email: string | null;
  website_url: string | null;
  availability_status: string;
  verification_status: VerificationStatus;
  is_active: boolean;
  categories: Array<{ id: string; name: string; slug: string }>;
  niches: Array<{ id: string; name: string; slug: string; category_id: string }>;
  socialAccounts: Array<{
    platform: string;
    username: string;
    followers_count: number | null;
    engagement_rate: number | null;
    metrics_source: string;
    is_verified: boolean;
  }>;
  rates: Array<{ service_type: string; min_rate: number; max_rate: number; currency: string }>;
  total_followers: number | null;
  max_engagement_rate: number | null;
  min_rate: number | null;
  demographics?: {
    is_verified: boolean;
    source: string;
    age_range: Json;
    gender: Json;
    top_locations: Json;
    top_languages: Json;
  };
  is_favorited: boolean;
}

export interface CreatorDetail extends CreatorListItem {
  portfolios: Array<{
    id: string;
    title: string;
    description: string | null;
    is_public: boolean;
    sort_order: number;
    media_count: number;
  }>;
  media: Array<{
    id: string;
    portfolio_id: string | null;
    storage_path: string;
    media_kind: MediaKind;
    title: string | null;
    caption: string | null;
    duration_seconds: number | null;
  }>;
}

// ---------------------------------------------------------------------------
// Public discovery + filtering (efficient, paginated)
// ---------------------------------------------------------------------------

/**
 * List public creator profiles with rich filtering and pagination.
 *
 * Cross-table filters (category, niche, platform, audience size, engagement,
 * rates) are resolved into candidate creator id sets and intersected, so the
 * final query runs against a single table and the total count stays accurate.
 * Never fabricates metrics: audience/engagement values are only ever those
 * stored on connected social accounts, tagged with their metrics source.
 */
export async function listCreators(
  params: Partial<ListCreatorsInput> = {},
  client?: Client
): Promise<ServiceResult<PaginatedCreatorResult>> {
  const supabase = client ?? getSupabaseClient();
  const validated = listCreatorsSchema.safeParse(params);
  if (!validated.success) {
    return fail(
      Errors.validationFailed("Invalid discovery filters.", {
        fields: parseZodError(validated.error),
      })
    );
  }

  const p = validated.data;
  const limit = Math.min(p.limit, 100);
  const offset = p.offset;

  // Resolve candidate id sets for cross-table filters, then intersect them.
  let allowedIds: string[] | null = null;
  const intersect = (ids: string[]) => {
    const idSet = new Set(ids);
    if (allowedIds === null) {
      allowedIds = Array.from(idSet);
    } else {
      allowedIds = allowedIds.filter((id) => idSet.has(id));
    }
  };

  if (p.categoryId) {
    const { data } = await supabase
      .from("creator_profile_categories")
      .select("creator_profile_id")
      .eq("creator_category_id", p.categoryId);
    intersect((data ?? []).map((row: any) => row.creator_profile_id));
  }

  if (p.nicheId) {
    const { data } = await supabase
      .from("creator_profile_niches")
      .select("creator_profile_id")
      .eq("creator_niche_id", p.nicheId);
    intersect((data ?? []).map((row: any) => row.creator_profile_id));
  }

  if (p.platform) {
    const { data } = await supabase
      .from("creator_social_accounts")
      .select("creator_profile_id")
      .eq("platform", p.platform);
    intersect((data ?? []).map((row: any) => row.creator_profile_id));
  }

  if (p.audienceSize) {
    const bounds = AUDIENCE_SIZE_BOUNDS[p.audienceSize];
    let query = supabase
      .from("creator_social_accounts")
      .select("creator_profile_id")
      .gte("followers_count", bounds.min);
    if (bounds.max !== null) {
      query = query.lte("followers_count", bounds.max);
    }
    const { data } = await query;
    intersect((data ?? []).map((row: any) => row.creator_profile_id));
  }

  if (p.minEngagementRate !== undefined || p.maxEngagementRate !== undefined) {
    let query = supabase.from("creator_social_accounts").select("creator_profile_id");
    if (p.minEngagementRate !== undefined) query = query.gte("engagement_rate", p.minEngagementRate);
    if (p.maxEngagementRate !== undefined) query = query.lte("engagement_rate", p.maxEngagementRate);
    const { data } = await query;
    intersect((data ?? []).map((row: any) => row.creator_profile_id));
  }

  if (p.minRate !== undefined || p.maxRate !== undefined) {
    let query = supabase.from("creator_rates").select("creator_profile_id");
    if (p.maxRate !== undefined) query = query.lte("min_rate", p.maxRate);
    if (p.minRate !== undefined) query = query.gte("max_rate", p.minRate);
    const { data } = await query;
    intersect((data ?? []).map((row: any) => row.creator_profile_id));
  }

  // Base query on the single creator_profiles table (count stays accurate).
  let query = supabase
    .from("creator_profiles")
    .select(
      "id, profile_id, display_name, bio, location, languages, avatar_url, cover_url, contact_email, website_url, availability_status, verification_status, is_active, created_at",
      { count: "exact" }
    )
    .eq("is_active", true)
    .is("deleted_at", null);

  if (allowedIds !== null) {
    query = query.in("id", allowedIds);
  }
  if (p.availability) {
    query = query.eq("availability_status", p.availability);
  }
  if (p.verificationStatus) {
    query = query.eq("verification_status", p.verificationStatus);
  }
  if (p.language) {
    query = query.contains("languages", [p.language]);
  }
  if (p.location) {
    // Validate location input to prevent SQL injection via .or() filter.
    if (!/^[A-Za-z0-9\s\-_,.']{1,200}$/.test(p.location)) {
      return fail(Errors.validationFailed("Location contains invalid characters."));
    }
    const loc = `%${p.location.replace(/'/g, "''")}%`;
    query = query.ilike("location->>city", loc);
    query = query.or(`location->>region.ilike.${loc}`);
    query = query.or(`location->>country.ilike.${loc}`);
  }
  if (p.search) {
    // Validate search input to prevent SQL injection via .or() filter.
    if (!/^[A-Za-z0-9\s\-_,.']{1,200}$/.test(p.search)) {
      return fail(Errors.validationFailed("Search contains invalid characters."));
    }
    const term = `%${p.search.replace(/'/g, "''")}%`;
    query = query.ilike("display_name", term);
    query = query.or(`bio.ilike.${term}`);
  }

  const orderDesc = p.sortOrder === "desc";
  if (p.sortBy === "created_at") {
    query = query.order("created_at", { ascending: !orderDesc });
  } else if (p.sortBy === "display_name") {
    query = query.order("display_name", { ascending: !orderDesc });
  } else if (p.sortBy === "availability_status") {
    query = query.order("availability_status", { ascending: !orderDesc });
  } else if (p.sortBy === "verification_status") {
    query = query.order("verification_status", { ascending: !orderDesc });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: rows, error, count } = await query;
  if (error) return fail(mapSupabaseError(error));

  const creators = rows ?? [];
  const creatorIds = creators.map((row: any) => row.id);

  // Batch-enrich: categories, niches, social accounts, rates, demographics.
  const [categoryRows, nicheRows, socialRows, rateRows, demoRows] = await Promise.all([
    creatorIds.length
      ? supabase
          .from("creator_profile_categories")
          .select("creator_profile_id, creator_category_id, creator_categories(name, slug)")
          .in("creator_profile_id", creatorIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length
      ? supabase
          .from("creator_profile_niches")
          .select(
            "creator_profile_id, creator_niche_id, creator_niches(name, slug, category_id)"
          )
          .in("creator_profile_id", creatorIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length
      ? supabase
          .from("creator_social_accounts")
          .select("*")
          .in("creator_profile_id", creatorIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length
      ? supabase.from("creator_rates").select("*").in("creator_profile_id", creatorIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length
      ? supabase
          .from("creator_audience_demographics")
          .select("*")
          .in("creator_profile_id", creatorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const categoriesByCreator = groupBy(
    (categoryRows?.data ?? []) as Array<{ creator_profile_id: string; creator_category_id: string; creator_categories: { name: string; slug: string } | null }>,
    "creator_profile_id"
  );
  const nichesByCreator = groupBy(
    (nicheRows?.data ?? []) as Array<{ creator_profile_id: string; creator_niche_id: string; creator_niches: { name: string; slug: string; category_id: string } | null }>,
    "creator_profile_id"
  );
  const socialByCreator = groupBy(socialRows?.data ?? [], "creator_profile_id");
  const ratesByCreator = groupBy(rateRows?.data ?? [], "creator_profile_id");
  const demoByCreator = new Map(
    (demoRows?.data ?? []).map((row: any) => [row.creator_profile_id, row] as const)
  );

  // Favourited-by-me annotation (authenticated viewers only).
  let favoritedIds = new Set<string>();
  const currentProfileId = await getCurrentProfileId(supabase);
  if (currentProfileId && creatorIds.length) {
    const { data: favRows } = await supabase
      .from("creator_favorites")
      .select("creator_profile_id")
      .eq("profile_id", currentProfileId)
      .in("creator_profile_id", creatorIds);
    favoritedIds = new Set((favRows ?? []).map((row: any) => row.creator_profile_id));
  }

  const items: CreatorListItem[] = creators.map((row: any) => {
    const socials = (socialByCreator.get(row.id) ?? []).map((s) => ({
      platform: s.platform,
      username: s.username,
      followers_count: s.followers_count,
      engagement_rate: s.engagement_rate,
      metrics_source: s.metrics_source,
      is_verified: s.is_verified,
    }));
    const rates = (ratesByCreator.get(row.id) ?? []).map((r) => ({
      service_type: r.service_type,
      min_rate: r.min_rate,
      max_rate: r.max_rate,
      currency: r.currency,
    }));
    const totalFollowers = Math.max(
      ...(socials.map((s) => s.followers_count ?? 0) as number[]),
      -1
    );
    const maxEngagement = Math.max(
      ...(socials.map((s) => s.engagement_rate ?? 0) as number[]),
      -1
    );
    const minRate = Math.min(...(rates.map((r) => r.min_rate) as number[]), Infinity);
    const demo = demoByCreator.get(row.id) as CreatorAudienceDemographics | undefined;

    return {
      id: row.id,
      profile_id: row.profile_id,
      display_name: row.display_name,
      bio: row.bio,
      avatar_url: row.avatar_url,
      cover_url: row.cover_url,
      location: row.location,
      languages: row.languages ?? [],
      contact_email: row.contact_email,
      website_url: row.website_url,
      availability_status: row.availability_status,
      verification_status: row.verification_status,
      is_active: row.is_active,
      categories: (categoriesByCreator.get(row.id) ?? [])
        .filter((c) => c.creator_categories)
        .map((c) => ({
          id: c.creator_category_id,
          name: c.creator_categories!.name,
          slug: c.creator_categories!.slug,
        })),
      niches: (nichesByCreator.get(row.id) ?? [])
        .filter((n) => n.creator_niches)
        .map((n) => ({
          id: n.creator_niche_id,
          name: n.creator_niches!.name,
          slug: n.creator_niches!.slug,
          category_id: n.creator_niches!.category_id,
        })),
      socialAccounts: socials,
      rates,
      total_followers: totalFollowers >= 0 ? totalFollowers : null,
      max_engagement_rate: maxEngagement >= 0 ? maxEngagement : null,
      min_rate: minRate === Infinity ? null : minRate,
      demographics: demo
        ? {
            is_verified: demo.is_verified,
            source: demo.source,
            age_range: demo.age_range,
            gender: demo.gender,
            top_locations: demo.top_locations,
            top_languages: demo.top_languages,
          }
        : undefined,
      is_favorited: favoritedIds.has(row.id),
    };
  });

  const totalCount = count ?? 0;
  return ok({
    creators: items,
    count: totalCount,
    limit,
    offset,
    hasMore: offset + limit < totalCount,
  });
}

/**
 * Get a single creator's full public profile detail (portfolio, media, rates,
 * social accounts, demographics). Used for the creator profile page.
 */
export async function getCreatorDetail(
  id: string,
  client?: Client
): Promise<ServiceResult<CreatorDetail | null>> {
  const supabase = client ?? getSupabaseClient();

  const { data: profile, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(mapSupabaseError(error));
  if (!profile) return ok(null);

  const [
    categoryRows,
    nicheRows,
    socialRows,
    rateRows,
    portfolioRows,
    mediaRows,
    demoRows,
  ] = await Promise.all([
    supabase
      .from("creator_profile_categories")
      .select("creator_category_id, creator_categories(name, slug)")
      .eq("creator_profile_id", id),
    supabase
      .from("creator_profile_niches")
      .select("creator_niche_id, creator_niches(name, slug, category_id)")
      .eq("creator_profile_id", id),
    supabase.from("creator_social_accounts").select("*").eq("creator_profile_id", id),
    supabase.from("creator_rates").select("*").eq("creator_profile_id", id),
    supabase
      .from("creator_portfolios")
      .select("*")
      .eq("creator_profile_id", id)
      .eq("is_public", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("creator_media")
      .select("*")
      .eq("creator_profile_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("creator_audience_demographics").select("*").eq("creator_profile_id", id).maybeSingle(),
  ]);

  const socials = ((socialRows?.data ?? []) as CreatorSocialAccounts[]).map((s) => ({
    platform: s.platform,
    username: s.username,
    followers_count: s.followers_count,
    engagement_rate: s.engagement_rate,
    metrics_source: s.metrics_source,
    is_verified: s.is_verified,
    profile_url: s.profile_url,
    is_platform_verified: s.is_verified,
  }));
  const rates = ((rateRows?.data ?? []) as CreatorRates[]).map((r) => ({
    service_type: r.service_type,
    min_rate: r.min_rate,
    max_rate: r.max_rate,
    currency: r.currency,
  }));
  const portfolios = ((portfolioRows?.data ?? []) as CreatorPortfolios[]).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    is_public: p.is_public,
    sort_order: p.sort_order,
    media_count: 0,
  }));
  const media = ((mediaRows?.data ?? []) as CreatorMedia[]).map((m) => ({
    id: m.id,
    portfolio_id: m.portfolio_id,
    storage_path: m.storage_path,
    media_kind: m.media_kind,
    title: m.title,
    caption: m.caption,
    duration_seconds: m.duration_seconds,
  }));
  const totalFollowers = Math.max(
    ...(socials.map((s) => s.followers_count ?? 0) as number[]),
    -1
  );
  const maxEngagement = Math.max(
    ...(socials.map((s) => s.engagement_rate ?? 0) as number[]),
    -1
  );
  const minRate = Math.min(...(rates.map((r) => r.min_rate) as number[]), Infinity);

  const detail: CreatorDetail = {
    id: profile.id,
    profile_id: profile.profile_id,
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    cover_url: profile.cover_url,
    location: profile.location,
    languages: profile.languages ?? [],
    contact_email: profile.contact_email,
    website_url: profile.website_url,
    availability_status: profile.availability_status,
    verification_status: profile.verification_status,
    is_active: profile.is_active,
    categories: (categoryRows?.data ?? []).map((c: any) => ({
      id: c.creator_category_id,
      name: c.creator_categories?.name ?? "",
      slug: c.creator_categories?.slug ?? "",
    })),
    niches: (nicheRows?.data ?? []).map((n: any) => ({
      id: n.creator_niche_id,
      name: n.creator_niches?.name ?? "",
      slug: n.creator_niches?.slug ?? "",
      category_id: n.creator_niches?.category_id ?? "",
    })),
    socialAccounts: socials,
    rates,
    total_followers: totalFollowers >= 0 ? totalFollowers : null,
    max_engagement_rate: maxEngagement >= 0 ? maxEngagement : null,
    min_rate: minRate === Infinity ? null : minRate,
    demographics: demoRows
      ? {
          is_verified: demoRows.is_verified,
          source: demoRows.source,
          age_range: demoRows.age_range,
          gender: demoRows.gender,
          top_locations: demoRows.top_locations,
          top_languages: demoRows.top_languages,
        }
      : undefined,
    is_favorited: false,
    portfolios,
    media,
  };

  return ok(detail);
}

// ---------------------------------------------------------------------------
// Favourites
// ---------------------------------------------------------------------------

/**
 * Toggle a creator in the current profile's favourites.
 */
export async function toggleFavorite(
  input: FavoriteToggleInput,
  client?: Client
): Promise<ServiceResult<{ is_favorited: boolean }>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const existing = await getCreatorProfile(input.creator_profile_id, supabase);
  if (existing.error || !existing.data) {
    return fail(Errors.creatorProfileNotFound());
  }

  const { data: favRows } = await supabase
    .from("creator_favorites")
    .select("id")
    .eq("profile_id", profileId)
    .eq("creator_profile_id", input.creator_profile_id)
    .maybeSingle();

  if (favRows) {
    const { error } = await supabase
      .from("creator_favorites")
      .delete()
      .eq("id", favRows.id);
    if (error) return fail(mapSupabaseError(error));
    return ok({ is_favorited: false });
  }

  const { data, error } = await supabase
    .from("creator_favorites")
    .insert({ profile_id: profileId, creator_profile_id: input.creator_profile_id })
    .select("id")
    .single();

  if (error) return fail(mapSupabaseError(error));
  if (!data) return fail(Errors.internal("Favorite was not saved."));
  return ok({ is_favorited: true });
}

/**
 * List the current profile's favourited creators (paginated).
 */
export async function listFavorites(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client
): Promise<ServiceResult<PaginatedCreatorResult>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { data: favRows, error } = await supabase
    .from("creator_favorites")
    .select("creator_profile_id")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .range(offset, offset + Math.min(limit, 100) - 1);

  if (error) return fail(mapSupabaseError(error));
  const creatorIds = (favRows ?? []).map((row: any) => row.creator_profile_id);

  if (creatorIds.length === 0) {
    return ok({ creators: [], count: 0, limit, offset, hasMore: false });
  }

  const { data: rows, error: rowsError, count } = await supabase
    .from("creator_profiles")
    .select(
      "id, profile_id, display_name, bio, avatar_url, cover_url, location, languages, availability_status, verification_status, is_active",
      { count: "exact" }
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("id", creatorIds)
    .order("created_at", { ascending: false });

  if (rowsError) return fail(mapSupabaseError(rowsError));
  const creators = (rows ?? []).map((row: any) => ({
    id: row.id,
    profile_id: row.profile_id,
    display_name: row.display_name,
    bio: row.bio,
    avatar_url: row.avatar_url,
    cover_url: row.cover_url,
    location: row.location,
    languages: row.languages ?? [],
    contact_email: row.contact_email,
    website_url: row.website_url,
    availability_status: row.availability_status,
    verification_status: row.verification_status,
    is_active: row.is_active,
    categories: [],
    niches: [],
    socialAccounts: [],
    rates: [],
    total_followers: null,
    max_engagement_rate: null,
    min_rate: null,
    demographics: undefined,
    is_favorited: true,
  }));

  return ok({
    creators,
    count: count ?? 0,
    limit,
    offset,
    hasMore: offset + Math.min(limit, 100) < (count ?? 0),
  });
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export async function createCollection(
  input: CollectionCreateInput,
  client?: Client
): Promise<ServiceResult<CreatorCollections>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { data, error } = await supabase
    .from("creator_collections")
    .insert({
      owner_profile_id: profileId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      is_public: input.is_public,
    })
    .select("*")
    .single();

  if (error) return fail(mapSupabaseError(error));
  if (!data) return fail(Errors.internal("Collection was not created."));
  return ok(data);
}

export async function listCollections(
  client?: Client
): Promise<ServiceResult<CreatorCollections[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { data, error } = await supabase
    .from("creator_collections")
    .select("*")
    .eq("owner_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) return fail(mapSupabaseError(error));
  return ok(data ?? []);
}

export async function getCollection(
  collectionId: string,
  client?: Client
): Promise<ServiceResult<{ collection: CreatorCollections; items: CreatorListItem[] } | null>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { data: collection, error } = await supabase
    .from("creator_collections")
    .select("*")
    .eq("id", collectionId)
    .filter("is_public", "eq", "true")
    .eq("owner_profile_id", profileId)
    .maybeSingle();

  if (error) return fail(mapSupabaseError(error));
  if (!collection) return ok(null);

  const { data: itemRows } = await supabase
    .from("creator_collection_items")
    .select("creator_profile_id")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: true });

  const creatorIds = (itemRows ?? []).map((row: any) => row.creator_profile_id);
  let items: CreatorListItem[] = [];
  if (creatorIds.length) {
    const { data: rows } = await supabase
      .from("creator_profiles")
      .select(
        "id, profile_id, display_name, bio, avatar_url, cover_url, location, languages, availability_status, verification_status, is_active"
      )
      .eq("is_active", true)
      .is("deleted_at", null)
      .in("id", creatorIds);
    items = (rows ?? []).map((row: any) => ({
      id: row.id,
      profile_id: row.profile_id,
      display_name: row.display_name,
      bio: row.bio,
      avatar_url: row.avatar_url,
      cover_url: row.cover_url,
      location: row.location,
      languages: row.languages ?? [],
      contact_email: row.contact_email,
      website_url: row.website_url,
      availability_status: row.availability_status,
      verification_status: row.verification_status,
      is_active: row.is_active,
      categories: [],
      niches: [],
      socialAccounts: [],
      rates: [],
      total_followers: null,
      max_engagement_rate: null,
      min_rate: null,
      demographics: undefined,
      is_favorited: false,
    }));
  }

  return ok({ collection, items });
}

export async function updateCollection(
  collectionId: string,
  input: CollectionUpdateInput,
  client?: Client
): Promise<ServiceResult<CreatorCollections>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { data, error } = await supabase
    .from("creator_collections")
    .update(input)
    .eq("id", collectionId)
    .eq("owner_profile_id", profileId)
    .select("*")
    .single();

  if (error) return fail(mapSupabaseError(error));
  if (!data) return fail(Errors.notFound("Collection"));
  return ok(data);
}

export async function deleteCollection(
  collectionId: string,
  client?: Client
): Promise<ServiceResult<null>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { error } = await supabase
    .from("creator_collections")
    .delete()
    .eq("id", collectionId)
    .eq("owner_profile_id", profileId);

  if (error) return fail(mapSupabaseError(error));
  return ok(null);
}

export async function addCollectionItem(
  input: CollectionItemInput,
  client?: Client
): Promise<ServiceResult<CreatorCollectionItems>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  // Verify ownership of the collection.
  const { data: collection } = await supabase
    .from("creator_collections")
    .select("id")
    .eq("id", input.collection_id)
    .eq("owner_profile_id", profileId)
    .maybeSingle();
  if (!collection) {
    return fail(Errors.notFound("Collection"));
  }

  const { data, error } = await supabase
    .from("creator_collection_items")
    .insert({ collection_id: input.collection_id, creator_profile_id: input.creator_profile_id })
    .select("*")
    .single();

  if (error) return fail(mapSupabaseError(error));
  if (!data) return fail(Errors.internal("Item was not added to collection."));
  return ok(data);
}

export async function removeCollectionItem(
  collectionId: string,
  creatorProfileId: string,
  client?: Client
): Promise<ServiceResult<null>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { error } = await supabase
    .from("creator_collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("creator_profile_id", creatorProfileId);

  if (error) return fail(mapSupabaseError(error));
  return ok(null);
}

// ---------------------------------------------------------------------------
// Compare creators (side-by-side)
// ---------------------------------------------------------------------------

export async function compareCreators(
  ids: string[],
  client?: Client
): Promise<ServiceResult<CreatorListItem[]>> {
  const supabase = client ?? getSupabaseClient();
  if (!ids || ids.length === 0) return ok([]);
  if (ids.length > 5) {
    return fail(Errors.validationFailed("You can compare up to 5 creators at a time."));
  }

  const { data: rows, error } = await supabase
    .from("creator_profiles")
    .select(
      "id, profile_id, display_name, bio, avatar_url, cover_url, location, languages, contact_email, website_url, availability_status, verification_status, is_active"
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("id", ids);

  if (error) return fail(mapSupabaseError(error));
  const creatorIds = (rows ?? []).map((row: any) => row.id);

  const [socialRows, rateRows, demoRows] = await Promise.all([
    creatorIds.length ? supabase.from("creator_social_accounts").select("*").in("creator_profile_id", creatorIds) : Promise.resolve({ data: [] }),
    creatorIds.length ? supabase.from("creator_rates").select("*").in("creator_profile_id", creatorIds) : Promise.resolve({ data: [] }),
    creatorIds.length ? supabase.from("creator_audience_demographics").select("*").in("creator_profile_id", creatorIds) : Promise.resolve({ data: [] }),
  ]);

  const socialByCreator = groupBy(socialRows?.data ?? [], "creator_profile_id");
  const ratesByCreator = groupBy(rateRows?.data ?? [], "creator_profile_id");
  const demoByCreator = new Map((demoRows?.data ?? []).map((row: any) => [row.creator_profile_id, row] as const));

  const items: CreatorListItem[] = (rows ?? []).map((row: any) => {
    const socials = (socialByCreator.get(row.id) ?? []).map((s) => ({
      platform: s.platform,
      username: s.username,
      followers_count: s.followers_count,
      engagement_rate: s.engagement_rate,
      metrics_source: s.metrics_source,
      is_verified: s.is_verified,
    }));
    const rates = (ratesByCreator.get(row.id) ?? []).map((r) => ({
      service_type: r.service_type,
      min_rate: r.min_rate,
      max_rate: r.max_rate,
      currency: r.currency,
    }));
    const demo = demoByCreator.get(row.id) as CreatorAudienceDemographics | undefined;
    const totalFollowers = Math.max(...(socials.map((s) => s.followers_count ?? 0) as number[]), -1);
    const maxEngagement = Math.max(...(socials.map((s) => s.engagement_rate ?? 0) as number[]), -1);
    const minRate = Math.min(...(rates.map((r) => r.min_rate) as number[]), Infinity);

    return {
      id: row.id,
      profile_id: row.profile_id,
      display_name: row.display_name,
      bio: row.bio,
      avatar_url: row.avatar_url,
      cover_url: row.cover_url,
      location: row.location,
      languages: row.languages ?? [],
      contact_email: row.contact_email,
      website_url: row.website_url,
      availability_status: row.availability_status,
      verification_status: row.verification_status,
      is_active: row.is_active,
      categories: [],
      niches: [],
      socialAccounts: socials,
      rates,
      total_followers: totalFollowers >= 0 ? totalFollowers : null,
      max_engagement_rate: maxEngagement >= 0 ? maxEngagement : null,
      min_rate: minRate === Infinity ? null : minRate,
      demographics: demo
        ? {
            is_verified: demo.is_verified,
            source: demo.source,
            age_range: demo.age_range,
            gender: demo.gender,
            top_locations: demo.top_locations,
            top_languages: demo.top_languages,
          }
        : undefined,
      is_favorited: false,
    };
  });

  return ok(items);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Group an array of rows by a key column into a Map<key, row[]>.
 */
function groupBy<T extends { [key: string]: unknown }>(
  rows: T[],
  key: string
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = String(row[key]);
    const bucket = map.get(k) ?? [];
    bucket.push(row);
    map.set(k, bucket);
  }
  return map;
}

/**
 * Invite a creator to a campaign (creates a collaboration invitation).
 * Requires the caller to be a member of the campaign's brand (RLS enforced).
 */
export async function inviteCreatorToCampaign(
  input: CollaborationInvitationInput,
  client?: Client
): Promise<ServiceResult<CollaborationInvitations>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const campaign = await getCampaignForInvite(input.campaign_id, supabase);
  if (!campaign) {
    return fail(Errors.campaignNotFound());
  }

  // Caller must be able to manage the campaign's brand.
  const { data: isMember } = await supabase.rpc("can_manage_brand", {
    p_brand: campaign.brand_id,
    p_profile: profileId,
  });
  if (isMember !== true) {
    return fail(Errors.campaignNotBrandMember());
  }

  const creator = await getCreatorProfile(input.creator_profile_id, supabase);
  if (creator.error || !creator.data) {
    return fail(Errors.creatorProfileNotFound());
  }

  try {
    const { data, error } = await supabase
      .from("collaboration_invitations")
      .insert({
        campaign_id: input.campaign_id,
        brand_id: campaign.brand_id,
        creator_profile_id: input.creator_profile_id,
        invited_by: profileId,
        proposed_fee: input.proposed_fee ?? null,
        currency: input.currency,
        message: input.message ?? null,
        token: generateInvitationToken(),
        token_hash: generateInvitationToken(),
        status: "pending",
        expires_at: input.expires_at.toISOString(),
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Invitation was not created."));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

async function getCampaignForInvite(
  campaignId: string,
  supabase: Client
): Promise<{ id: string; brand_id: string } | null> {
  const { data } = await supabase
    .from("campaigns")
    .select("id, brand_id")
    .eq("id", campaignId)
    .is("deleted_at", null)
    .maybeSingle();
  return data ?? null;
}

function generateInvitationToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 16)}`;
}


