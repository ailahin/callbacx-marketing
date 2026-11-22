/**
 * CALLBACX MARKETING — Brand service
 *
 * Brand creation, editing, membership, invitations, and verification.
 * All brand-scoped writes require brand owner/admin membership, enforced
 * by RLS (can_manage_brand / is_brand_owner helpers) and checked here too.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type {
  Brands,
  BrandMembers,
  BrandInvitations,
  BrandCategories,
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { BrandCreateInput, BrandUpdateInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Brand CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new brand. The caller becomes the owner.
 * RLS: brands_insert_owner (auth.uid() = owner_id).
 */
export async function createBrand(
  input: BrandCreateInput,
  client?: Client
): Promise<ServiceResult<Brands>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    const { data, error } = await supabase
      .from("brands")
      .insert({
        owner_id: profileId,
        name: input.name,
        legal_name: input.legal_name ?? null,
        trade_name: input.trade_name ?? null,
        description: input.description ?? null,
        website_url: input.website_url ?? null,
        contact_email: input.contact_email ?? null,
        contact_phone: input.contact_phone ?? null,
        address: input.address ?? {},
        brand_category_id: input.brand_category_id ?? null,
        verification_status: "pending",
        is_active: true,
        status: "active",
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Brand was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a brand by ID. Public read for active brands; owner/member read for all.
 */
export async function getBrand(
  brandId: string,
  client?: Client
): Promise<ServiceResult<Brands | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update a brand. Requires can_manage_brand (owner or active admin/member).
 * RLS: brands_update_manager.
 */
export async function updateBrand(
  brandId: string,
  input: BrandUpdateInput,
  client?: Client
): Promise<ServiceResult<Brands>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (!(await canManageBrand(supabase, brandId, profileId))) {
    return fail(Errors.brandNotOwner());
  }

  try {
    const { data, error } = await supabase
      .from("brands")
      .update(input)
      .eq("id", brandId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.brandNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * List active brands (public discovery).
 */
export async function listBrands(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client
): Promise<ServiceResult<Brands[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Brand categories (reference data, public read)
// ---------------------------------------------------------------------------

export async function listBrandCategories(
  client?: Client
): Promise<ServiceResult<BrandCategories[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("brand_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Brand members
// ---------------------------------------------------------------------------

/**
 * List members of a brand (brand members + staff can read).
 */
export async function listBrandMembers(
  brandId: string,
  client?: Client
): Promise<ServiceResult<BrandMembers[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (
    !(await isBrandOwner(supabase, brandId, profileId)) &&
    !(await isBrandMember(supabase, brandId, profileId)) &&
    !(await isStaff(supabase, profileId))
  ) {
    return fail(Errors.brandNotMember());
  }

  try {
    const { data, error } = await supabase
      .from("brand_members")
      .select("*, profile:profiles(id, full_name, avatar_url, headline)")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .order("joined_at", { ascending: true });

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Brand invitations
// ---------------------------------------------------------------------------

/**
 * Create a brand invitation (single-use token). Requires can_manage_brand.
 */
export async function createBrandInvitation(
  input: {
    brandId: string;
    email: string;
    role: "owner" | "admin" | "member" | "finance" | "viewer";
    invitedByProfileId: string;
    expiresAt: string;
  },
  client?: Client
): Promise<ServiceResult<BrandInvitations>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (!(await canManageBrand(supabase, input.brandId, profileId))) {
    return fail(Errors.brandNotOwner());
  }

  try {
    const { data, error } = await supabase
      .from("brand_invitations")
      .insert({
        brand_id: input.brandId,
        email: input.email,
        role: input.role,
        invited_by: input.invitedByProfileId,
        expires_at: input.expiresAt,
        status: "pending",
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  return getCachedProfileId(supabase);
}

async function canManageBrand(
  supabase: Client,
  brandId: string,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("can_manage_brand", { p_brand: brandId, p_profile: profileId });
  return data === true;
}

async function isBrandOwner(
  supabase: Client,
  brandId: string,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_brand_owner", { p_brand: brandId, p_profile: profileId });
  return data === true;
}

async function isBrandMember(
  supabase: Client,
  brandId: string,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_brand_member", { p_brand: brandId, p_profile: profileId });
  return data === true;
}

async function isStaff(
  supabase: Client,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}


