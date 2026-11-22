/**
 * CALLBACX MARKETING — Reviews service
 *
 * Reviews tied to completed collaborations. One review per reviewer per
 * collaboration. Public reviews readable by all; private reviews by
 * participants + staff.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { Reviews } from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { ReviewCreateInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/**
 * Create a review for a completed collaboration. Reviewer must be a
 * participant and the collaboration must be completed.
 */
export async function createReview(
  input: ReviewCreateInput,
  client?: Client
): Promise<ServiceResult<Reviews>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const collaboration = await getCollaborationParticipant(supabase, input.collaboration_id, profileId);
  if (!collaboration) {
    return fail(Errors.collaborationNotFound());
  }

  if (collaboration.status !== "completed") {
    return fail(Errors.forbidden("Reviews are only allowed for completed collaborations."));
  }

  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);
  const isCreator = creatorProfileId === collaboration.creator_profile_id;
  const revieweeId = isCreator ? collaboration.brand_owner_id : collaboration.creator_profile_id;

  if (!revieweeId) {
    return fail(Errors.forbidden("Cannot determine reviewee."));
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        collaboration_id: input.collaboration_id,
        reviewer_id: profileId,
        reviewee_id: revieweeId,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body ?? null,
        is_public: input.is_public,
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.reviewDuplicate());

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a review by ID (public if is_public, participants, staff).
 */
export async function getReview(
  reviewId: string,
  client?: Client
): Promise<ServiceResult<Reviews | null>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * List public reviews for a reviewee (profile).
 */
export async function listReviewsForReviewee(
  revieweeId: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
  client?: Client
): Promise<ServiceResult<Reviews[]>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_id", revieweeId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update a review (reviewer only).
 */
export async function updateReview(
  reviewId: string,
  input: Partial<Pick<ReviewCreateInput, "rating" | "title" | "body" | "is_public">>,
  client?: Client
): Promise<ServiceResult<Reviews>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const review = await getReview(reviewId, supabase);
  if (review.error || !review.data) {
    return fail(Errors.reviewNotFound());
  }

  if (review.data.reviewer_id !== profileId) {
    return fail(Errors.reviewNotReviewer());
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update(input)
      .eq("id", reviewId)
      .eq("reviewer_id", profileId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.reviewNotFound());

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

interface CollaborationParticipant {
  status: string;
  creator_profile_id: string;
  brand_owner_id: string | null;
}

async function getCollaborationParticipant(
  supabase: Client,
  collaborationId: string,
  profileId: string
): Promise<CollaborationParticipant | null> {
  const creatorProfileId = await getCreatorProfileIdForProfile(supabase, profileId);
  const isCreator = Boolean(creatorProfileId);

  const { data } = await supabase
    .from("collaborations")
    .select(`
      status,
      creator_profile_id,
      brand:brands(owner_id)
    `)
    .eq("id", collaborationId)
    .maybeSingle();

  if (!data) return null;

  const isCreatorOwner = isCreator && data.creator_profile_id === creatorProfileId;
  const isBrandOwner = data.brand?.owner_id === profileId;

  if (!isCreatorOwner && !isBrandOwner) {
    return null;
  }

  return {
    status: data.status,
    creator_profile_id: data.creator_profile_id,
    brand_owner_id: data.brand?.owner_id ?? null,
  };
}


