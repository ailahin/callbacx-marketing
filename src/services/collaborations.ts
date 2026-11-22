/**
 * CALLBACX MARKETING — Collaboration service
 *
 * Collaboration invitations, collaborations, and contracts.
 * Participants: creator profile owner + brand-side members (owner/admin).
 * RLS enforces participant-scoped access throughout.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type {
  Collaborations,
  CollaborationInvitations,
  CollaborationContracts,
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type {
  CollaborationInvitationInput,
  CollaborationInvitationResponseInput,
  CollaborationStatusUpdateInput,
} from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Collaboration invitations
// ---------------------------------------------------------------------------

/**
 * Invite a creator to a collaboration. Requires brand membership.
 * RLS: collaboration_invitations_insert_brand (can_manage_brand).
 */
export async function createCollaborationInvitation(
  input: CollaborationInvitationInput,
  client?: Client
): Promise<ServiceResult<CollaborationInvitations>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const campaign = await getCampaignById(supabase, input.campaign_id);
  if (!campaign) {
    return fail(Errors.campaignNotFound());
  }

  if (
    !(await canManageBrand(supabase, campaign.brand_id, profileId)) &&
    !(await isStaff(supabase, profileId))
  ) {
    return fail(Errors.campaignNotBrandMember());
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("id", input.creator_profile_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!creatorProfile) {
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
        expires_at: input.expires_at.toISOString(),
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

/**
 * Get an invitation by ID. Readable by brand managers, creator owner, or staff.
 */
export async function getInvitation(
  invitationId: string,
  client?: Client
): Promise<ServiceResult<CollaborationInvitations | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("collaboration_invitations")
      .select("*")
      .eq("id", invitationId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * List pending invitations for a creator (creator owns the profile).
 */
export async function listInvitationsForCreator(
  creatorProfileId: string,
  client?: Client
): Promise<ServiceResult<CollaborationInvitations[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const creatorProfile = await getCreatorProfileIdForProfile(supabase, profileId);
  if (!creatorProfile || creatorProfile !== creatorProfileId) {
    return fail(Errors.creatorProfileNotOwner());
  }

  try {
    const { data, error } = await supabase
      .from("collaboration_invitations")
      .select("*, campaign:campaigns(title, brand_id), brand:brands(name)")
      .eq("creator_profile_id", creatorProfileId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Respond to an invitation (accept/decline). Creator owner or brand manager.
 */
export async function respondToInvitation(
  input: CollaborationInvitationResponseInput,
  client?: Client
): Promise<ServiceResult<CollaborationInvitations>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const invitation = await getInvitation(input.invitation_id, supabase);
  if (invitation.error || !invitation.data) {
    return fail(Errors.invitationNotFound());
  }

  if (invitation.data.status !== "pending") {
    return fail(Errors.invitationAlreadyResponded());
  }

  const now = new Date();
  if (new Date(invitation.data.expires_at) < now) {
    return fail(Errors.invitationExpired());
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);
  const isCreator = creatorProfileId === invitation.data.creator_profile_id;
  const isBrandManager = await canManageBrand(supabase, invitation.data.brand_id, profileId);

  if (!isCreator && !isBrandManager && !(await isStaff(supabase, profileId))) {
    return fail(Errors.forbidden());
  }

  const newStatus = input.accept ? "accepted" : "declined";

  try {
    const { data, error } = await supabase
      .from("collaboration_invitations")
      .update({
        status: newStatus,
        responded_at: now.toISOString(),
        accepted_by: input.accept ? profileId : null,
      })
      .eq("id", input.invitation_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.invitationNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Collaborations
// ---------------------------------------------------------------------------

/**
 * Create a collaboration from an accepted application or invitation.
 * Requires brand membership OR (creator owns profile + accepted application).
 */
export async function createCollaboration(
  input: {
    campaignId: string;
    brandId: string;
    creatorProfileId: string;
    agreedFee?: number | null;
    currency?: string;
  },
  client?: Client
): Promise<ServiceResult<Collaborations>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);
  const isCreatorOwner = creatorProfileId === input.creatorProfileId;
  const isBrandManager = await canManageBrand(supabase, input.brandId, profileId);

  if (isCreatorOwner) {
    const { data: app } = await supabase
      .from("campaign_applications")
      .select("status")
      .eq("campaign_id", input.campaignId)
      .eq("creator_profile_id", input.creatorProfileId)
      .eq("status", "accepted")
      .maybeSingle();

    if (!app) {
      return fail(Errors.forbidden("Creator has no accepted application for this campaign."));
    }
  }

  if (!isCreatorOwner && !isBrandManager && !(await isStaff(supabase, profileId))) {
    return fail(Errors.campaignNotBrandMember());
  }

  try {
    const { data, error } = await supabase
      .from("collaborations")
      .insert({
        campaign_id: input.campaignId,
        brand_id: input.brandId,
        creator_profile_id: input.creatorProfileId,
        status: "negotiating",
        agreed_fee: input.agreedFee ?? null,
        currency: input.currency ?? "USD",
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Collaboration was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a collaboration by ID (participants + staff).
 */
export async function getCollaboration(
  collaborationId: string,
  client?: Client
): Promise<ServiceResult<Collaborations | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("collaborations")
      .select("*, campaign:campaigns(title, brand_id), brand:brands(name), creator:creator_profiles(display_name)")
      .eq("id", collaborationId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * List collaborations for the current user (as brand member or creator).
 */
export async function listMyCollaborations(
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client
): Promise<ServiceResult<Collaborations[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);

  try {
    let query = supabase
      .from("collaborations")
      .select("*, campaign:campaigns(title), brand:brands(name), creator:creator_profiles(display_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (creatorProfileId) {
      query = query.eq("creator_profile_id", creatorProfileId);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update collaboration status. Participants or staff. Trigger enforces
 * valid transitions and sets completed_at when status = completed.
 */
export async function updateCollaborationStatus(
  input: CollaborationStatusUpdateInput,
  client?: Client
): Promise<ServiceResult<Collaborations>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const collaboration = await getCollaboration(input.collaboration_id, supabase);
  if (collaboration.error || !collaboration.data) {
    return fail(Errors.collaborationNotFound());
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);
  const isParticipant =
    creatorProfileId === collaboration.data.creator_profile_id ||
    (await canManageBrand(supabase, collaboration.data.brand_id, profileId));

  if (!isParticipant && !(await isStaff(supabase, profileId))) {
    return fail(Errors.collaborationNotParticipant());
  }

  try {
    const { data, error } = await supabase
      .from("collaborations")
      .update({ status: input.status })
      .eq("id", input.collaboration_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.collaborationNotFound());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

/**
 * Get the contract for a collaboration (participants + staff).
 */
export async function getContract(
  collaborationId: string,
  client?: Client
): Promise<ServiceResult<CollaborationContracts | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("collaboration_contracts")
      .select("*")
      .eq("collaboration_id", collaborationId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
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

async function getCampaignById(
  supabase: Client,
  campaignId: string
): Promise<{ brand_id: string } | null> {
  const { data } = await supabase
    .from("campaigns")
    .select("brand_id")
    .eq("id", campaignId)
    .maybeSingle();

  return data ?? null;
}

async function canManageBrand(
  supabase: Client,
  brandId: string,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("can_manage_brand", { p_brand: brandId, p_profile: profileId });
  return data === true;
}

async function isStaff(
  supabase: Client,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}


