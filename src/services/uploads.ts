/**
 * CALLBACX MARKETING — Upload service
 *
 * File and portfolio uploads to Supabase Storage.
 *
 * Security model:
 * - Clients upload DIRECTLY to Supabase Storage using the anon key.
 * - Storage RLS policies (migration 0014) enforce ownership via the object
 *   path (namespaced by owner id) — the service-role key is never needed
 *   for uploads and is never exposed to the browser.
 * - This service generates storage paths, validates file metadata, and
 *   creates DB records (creator_media, campaign_media, etc.) after upload.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type {
  CreatorMedia,
  CampaignMedia,
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
  type ServiceError,
} from "@/lib/errors";
import type { UploadPresignInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES: Record<string, number> = {
  "brand-logos": 5 * 1024 * 1024,
  "creator-avatars": 5 * 1024 * 1024,
  "creator-portfolios": 10 * 1024 * 1024,
  "campaign-assets": 20 * 1024 * 1024,
  "deliverable-submissions": 100 * 1024 * 1024,
  "contracts": 20 * 1024 * 1024,
  "messages": 10 * 1024 * 1024,
};

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  "brand-logos": ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  "creator-avatars": ["image/jpeg", "image/png", "image/webp"],
  "creator-portfolios": ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"],
  "campaign-assets": ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"],
  "deliverable-submissions": ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "application/pdf"],
  "contracts": ["application/pdf", "image/png", "image/jpeg"],
  "messages": ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "application/pdf", "audio/mpeg", "audio/wav"],
};

// ---------------------------------------------------------------------------
// Presigned upload metadata
// ---------------------------------------------------------------------------

/**
 * Generate upload metadata (storage path, bucket, size/mime limits) for a
 * client-side direct upload to Supabase Storage.
 *
 * The client then calls supabase.storage.from(bucket).upload(path, file)
 * directly using the anon key. Storage RLS validates ownership from the path.
 *
 * Path format: {bucket}/{ownerId}/{fileName}
 */
export async function getUploadMetadata(
  input: UploadPresignInput,
  client?: Client
): Promise<ServiceResult<{
  bucket: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  maxSizeBytes: number;
  uploadUrl: string;
}>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const maxSize = MAX_FILE_SIZE_BYTES[input.bucket];
  const allowedMimes = ALLOWED_MIME_TYPES[input.bucket];

  if (!maxSize || !allowedMimes) {
    return fail(Errors.uploadInvalidFile());
  }

  if (!allowedMimes.includes(input.content_type)) {
    return fail(Errors.uploadInvalidFile());
  }

  const storagePath = `${input.bucket}/${profileId}/${input.file_name}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const uploadUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/${storagePath}`
    : "";

  return ok({
    bucket: input.bucket,
    storagePath,
    fileName: input.file_name,
    contentType: input.content_type,
    maxSizeBytes: maxSize,
    uploadUrl,
  });
}

/**
 * Validate a file before upload (client-side reusable check).
 */
export function validateFile(file: File, bucket: string): { valid: true } | { valid: false; error: ServiceError } {
  const maxSize = MAX_FILE_SIZE_BYTES[bucket as keyof typeof MAX_FILE_SIZE_BYTES];
  const allowedMimes = ALLOWED_MIME_TYPES[bucket];

  if (!maxSize || !allowedMimes) {
    return { valid: false, error: Errors.uploadInvalidFile() };
  }

  if (!allowedMimes.includes(file.type)) {
    return { valid: false, error: Errors.uploadInvalidFile() };
  }

  if (file.size > maxSize) {
    return { valid: false, error: Errors.uploadFileTooLarge(maxSize) };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Media records (post-upload DB tracking)
// ---------------------------------------------------------------------------

/**
 * Create a creator_media record after a portfolio upload succeeds.
 * Owner only.
 */
export async function createCreatorMediaRecord(
  input: {
    creatorProfileId: string;
    portfolioId?: string | null;
    storagePath: string;
    mediaKind: "image" | "video" | "document";
    title?: string | null;
    caption?: string | null;
    durationSeconds?: number | null;
  },
  client?: Client
): Promise<ServiceResult<CreatorMedia>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("profile_id")
    .eq("id", input.creatorProfileId)
    .maybeSingle();

  if (!profile || profile.profile_id !== profileId) {
    return fail(Errors.creatorProfileNotOwner());
  }

  try {
    const { data, error } = await supabase
      .from("creator_media")
      .insert({
        creator_profile_id: input.creatorProfileId,
        portfolio_id: input.portfolioId ?? null,
        storage_path: input.storagePath,
        media_kind: input.mediaKind,
        title: input.title ?? null,
        caption: input.caption ?? null,
        duration_seconds: input.durationSeconds ?? null,
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Media record was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Create a campaign_media record after a campaign asset upload.
 * Brand member only.
 */
export async function createCampaignMediaRecord(
  input: {
    campaignId: string;
    storagePath: string;
    mediaKind: "image" | "video" | "document";
    title?: string | null;
    altText?: string | null;
  },
  client?: Client
): Promise<ServiceResult<CampaignMedia>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  const campaign = await getCampaignBrand(supabase, input.campaignId);
  if (!campaign) {
    return fail(Errors.campaignNotFound());
  }

  if (
    !(await canManageBrand(supabase, campaign.brand_id, profileId)) &&
    !(await isStaff(supabase, profileId))
  ) {
    return fail(Errors.campaignNotBrandMember());
  }

  try {
    const { data, error } = await supabase
      .from("campaign_media")
      .insert({
        campaign_id: input.campaignId,
        storage_path: input.storagePath,
        media_kind: input.mediaKind,
        title: input.title ?? null,
        alt_text: input.altText ?? null,
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Media record was not created."));

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

async function getCampaignBrand(
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


