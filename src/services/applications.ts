/**
 * CALLBACX TECHNOLOGY — Campaign application service
 *
 * Creator applications to campaigns, brand review (accept/reject), and
 * application status transitions. RLS enforces: creators see own apps,
 * brand members see apps to their campaigns.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { CampaignApplications } from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { CampaignApplicationInput, ApplicationReviewInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

/**
 * Apply to a campaign. One application per creator per campaign (unique
 * constraint enforced by DB + RLS).
 * RLS: campaign_applications_insert_creator.
 */
export async function applyToCampaign(
  input: CampaignApplicationInput,
  client?: Client
): Promise<ServiceResult<CampaignApplications>> {
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
      .from("campaign_applications")
      .insert({
        campaign_id: input.campaign_id,
        creator_profile_id: creatorProfileId,
        cover_letter: input.cover_letter ?? null,
        proposed_rate: input.proposed_rate ?? null,
        currency: input.currency,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.applicationDuplicate());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get an application by ID. Readable by the applicant, brand members of the
 * campaign, or staff.
 */
export async function getApplication(
  applicationId: string,
  client?: Client
): Promise<ServiceResult<CampaignApplications | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("campaign_applications")
      .select("*, campaign:campaigns(brand_id)")
      .eq("id", applicationId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * List applications for a campaign (brand members + staff) or for a creator
 * (their own applications).
 */
export async function listApplications(
  params: {
    campaignId?: string;
    creatorProfileId?: string;
    limit?: number;
    offset?: number;
  },
  client?: Client
): Promise<ServiceResult<CampaignApplications[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  try {
    let query = supabase
      .from("campaign_applications")
      .select("*, creator:creator_profiles(profile_id, display_name, avatar_url)")
      .order("applied_at", { ascending: false });

    if (params.campaignId) {
      const brandMember = await isCampaignBrandMember(supabase, params.campaignId, profileId);
      if (!brandMember && !(await isStaff(supabase, profileId))) {
        return fail(Errors.campaignNotBrandMember());
      }
      query = query.eq("campaign_id", params.campaignId);
    }

    if (params.creatorProfileId) {
      const creatorProfileIdForProfile = await getCreatorProfileIdForProfile(supabase, profileId);
      if (creatorProfileIdForProfile !== params.creatorProfileId && !(await isStaff(supabase, profileId))) {
        return fail(Errors.applicationNotApplicant());
      }
      query = query.eq("creator_profile_id", params.creatorProfileId);
    }

    query = query.range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 20) - 1);

    const { data, error } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Review (accept/reject) an application. Brand members + staff only.
 * Status transitions enforced by server trigger.
 */
export async function reviewApplication(
  input: ApplicationReviewInput,
  client?: Client
): Promise<ServiceResult<CampaignApplications>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const application = await getApplication(input.application_id, supabase);
  if (application.error || !application.data) {
    return fail(Errors.applicationNotFound());
  }

  if (
    !(await isCampaignBrandMember(supabase, application.data.campaign_id, profileId)) &&
    !(await isStaff(supabase, profileId))
  ) {
    return fail(Errors.campaignNotBrandMember());
  }

  if (
    application.data.status === "accepted" ||
    application.data.status === "rejected" ||
    application.data.status === "withdrawn"
  ) {
    return fail(Errors.applicationInvalidStatusTransition(application.data.status, input.status));
  }

  const patch: Record<string, unknown> = {
    status: input.status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: profileId,
  };
  if (input.status === "rejected" && input.rejection_reason) {
    patch.rejection_reason = input.rejection_reason;
  }

  try {
    const { data, error } = await supabase
      .from("campaign_applications")
      .update(patch)
      .eq("id", input.application_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.applicationNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Withdraw an application (applicant only). Only pending/under_review can be withdrawn.
 */
export async function withdrawApplication(
  applicationId: string,
  client?: Client
): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const application = await getApplication(applicationId, supabase);
  if (application.error || !application.data) {
    return fail(Errors.applicationNotFound());
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);
  if (!creatorProfileId || application.data.creator_profile_id !== creatorProfileId) {
    return fail(Errors.applicationNotApplicant());
  }

  if (application.data.status !== "pending" && application.data.status !== "under_review") {
    return fail(Errors.applicationInvalidStatusTransition(application.data.status, "withdrawn"));
  }

  try {
    const { error } = await supabase
      .from("campaign_applications")
      .update({ status: "withdrawn", reviewed_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
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

async function isCampaignBrandMember(
  supabase: Client,
  campaignId: string,
  profileId: string
): Promise<boolean> {
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("brand_id")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign) return false;

  const { data: owner } = await supabase.rpc("is_brand_owner", {
    p_brand: campaign.brand_id,
    p_profile: profileId,
  });
  if (owner === true) return true;
  const { data: member } = await supabase.rpc("is_brand_member", {
    p_brand: campaign.brand_id,
    p_profile: profileId,
  });
  return member === true;
}

async function isStaff(
  supabase: Client,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}


