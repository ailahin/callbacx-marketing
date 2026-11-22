/**
 * CALLBACX MARKETING — Campaign service
 *
 * Campaign creation, editing, publishing, and discovery. Campaign writes
 * require brand membership (can_manage_brand). Status transitions are
 * enforced server-side by the trg_campaign_status_transition trigger.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type {
  Campaigns,
  CampaignDeliverables,
  CampaignCategories,
  CampaignMedia,
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { CampaignCreateInput, CampaignUpdateInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

/**
 * Create a campaign for a brand. Caller must be a brand member.
 * RLS: campaigns_insert_brand (is_campaign_brand_member).
 */
export async function createCampaign(
  input: CampaignCreateInput,
  client?: Client
): Promise<ServiceResult<Campaigns>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const brandId = await getCallerBrandId(supabase, profileId);
  if (!brandId) {
    return fail(Errors.brandNotMember());
  }

  try {
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        brand_id: brandId,
        title: input.title,
        description: input.description ?? null,
        brief: input.brief ?? null,
        category_id: input.category_id ?? null,
        status: "draft",
        objective: input.objective ?? null,
        budget_total: input.budget_total,
        budget_currency: input.budget_currency,
        compensation_model: input.compensation_model,
        payment_terms: input.payment_terms ?? null,
        start_date: input.start_date?.toISOString() ?? null,
        end_date: input.end_date?.toISOString() ?? null,
        application_deadline: input.application_deadline?.toISOString() ?? null,
        location_requirements: input.location_requirements ?? {},
        platform_requirements: input.platform_requirements ?? [],
        visibility: input.visibility,
        approval_required: input.approval_required,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Campaign was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a campaign by ID. Public read for published/public campaigns;
 * brand members and staff read all.
 */
export async function getCampaign(
  campaignId: string,
  client?: Client
): Promise<ServiceResult<Campaigns | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update a campaign. Requires brand membership; status transitions enforced
 * by server-side trigger.
 * RLS: campaigns_update_brand.
 */
export async function updateCampaign(
  campaignId: string,
  input: CampaignUpdateInput,
  client?: Client
): Promise<ServiceResult<Campaigns>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const campaign = await getCampaign(campaignId, supabase);
  if (campaign.error || !campaign.data) {
    return fail(Errors.campaignNotFound());
  }

  if (
    !(await isCampaignBrandMember(supabase, campaign.data.brand_id, profileId)) &&
    !(await isStaff(supabase, profileId))
  ) {
    return fail(Errors.campaignNotBrandMember());
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.brief !== undefined) patch.brief = input.brief;
  if (input.category_id !== undefined) patch.category_id = input.category_id;
  if (input.objective !== undefined) patch.objective = input.objective;
  if (input.budget_total !== undefined) patch.budget_total = input.budget_total;
  if (input.budget_currency !== undefined) patch.budget_currency = input.budget_currency;
  if (input.compensation_model !== undefined) patch.compensation_model = input.compensation_model;
  if (input.payment_terms !== undefined) patch.payment_terms = input.payment_terms;
  if (input.start_date !== undefined) patch.start_date = input.start_date.toISOString();
  if (input.end_date !== undefined) patch.end_date = input.end_date.toISOString();
  if (input.application_deadline !== undefined)
    patch.application_deadline = input.application_deadline.toISOString();
  if (input.location_requirements !== undefined)
    patch.location_requirements = input.location_requirements;
  if (input.platform_requirements !== undefined)
    patch.platform_requirements = input.platform_requirements;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.approval_required !== undefined) patch.approval_required = input.approval_required;

  try {
    const { data, error } = await supabase
      .from("campaigns")
      .update(patch)
      .eq("id", campaignId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.campaignNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Publish a campaign (status draft/pending_approval -> published).
 * Requires brand membership. Server trigger enforces valid transitions
 * and sets approved_at/approved_by.
 */
export async function publishCampaign(
  campaignId: string,
  client?: Client
): Promise<ServiceResult<Campaigns>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const campaign = await getCampaign(campaignId, supabase);
  if (campaign.error || !campaign.data) {
    return fail(Errors.campaignNotFound());
  }

  if (
    !(await isCampaignBrandMember(supabase, campaign.data.brand_id, profileId)) &&
    !(await isStaff(supabase, profileId))
  ) {
    return fail(Errors.campaignNotBrandMember());
  }

  try {
    const { data, error } = await supabase
      .from("campaigns")
      .update({ status: "published" })
      .eq("id", campaignId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.campaignNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * List published public campaigns (discovery).
 */
export async function listPublishedCampaigns(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client
): Promise<ServiceResult<Campaigns[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, brand:brands(id, name, logo_url, verification_status)")
      .eq("status", "published")
      .eq("visibility", "public")
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
// Campaign deliverables
// ---------------------------------------------------------------------------

/**
 * List deliverables for a campaign (brand members + public read).
 */
export async function listCampaignDeliverables(
  campaignId: string,
  client?: Client
): Promise<ServiceResult<CampaignDeliverables[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("campaign_deliverables")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Campaign categories (reference data)
// ---------------------------------------------------------------------------

export async function listCampaignCategories(client?: Client): Promise<ServiceResult<CampaignCategories[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("campaign_categories")
      .select("*")
      .order("name", { ascending: true });

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

async function getCallerBrandId(
  supabase: Client,
  profileId: string
): Promise<string | null> {
  const { data: owned } = await supabase
    .from("brands")
    .select("id")
    .eq("owner_id", profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (owned) return owned.id;

  const { data: member } = await supabase
    .from("brand_members")
    .select("brand_id")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .maybeSingle();

  return member?.brand_id ?? null;
}

async function isCampaignBrandMember(
  supabase: Client,
  brandId: string,
  profileId: string
): Promise<boolean> {
  const { data: owner } = await supabase.rpc("is_brand_owner", { p_brand: brandId, p_profile: profileId });
  if (owner === true) return true;
  const { data: member } = await supabase.rpc("is_brand_member", { p_brand: brandId, p_profile: profileId });
  return member === true;
}

async function isStaff(
  supabase: Client,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}


