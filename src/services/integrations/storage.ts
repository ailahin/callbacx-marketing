/**
 * CALLBACX MARKETING — Supabase Storage service (server-side)
 *
 * Cloud file storage for integration-related assets (brand kits, campaign
 * assets, deliverables, exports).
 *
 * Uses the Supabase service-role client (server-only) so privileged server
 * operations can write/read buckets. Client-side direct uploads remain the
 * responsibility of src/services/uploads.ts (anon key + Storage RLS).
 *
 * - Buckets are referenced by name; ensureBucket creates a bucket if missing
 *   (private by default).
 * - Public URLs and signed URLs are generated server-side; no secrets leave
 *   the server.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseAdminClient().
 */

import { getSupabaseAdminClient } from "@/lib/supabase/client";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";

type Client = any;

interface BucketOption {
  public?: boolean;
  fileSizeLimit?: number; // bytes
  allowedMimeTypes?: string[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Ensure a storage bucket exists, creating it with sensible defaults when
 * missing. Requires service-role credentials.
 */
export async function ensureBucket(
  bucket: string,
  options: BucketOption = {},
  client?: Client
): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseAdminClient();

  try {
    const { data: existing } = await supabase.storage.getBucket(bucket);
    if (existing) return ok(undefined);
  } catch {
    // getBucket throws when the bucket does not exist — fall through to create.
  }

  try {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: options.public ?? false,
      allowed_mime_types: options.allowedMimeTypes,
      file_size_limit: options.fileSizeLimit,
    });

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Upload a buffer to a storage path. Overwrites if upsert is true.
 */
export async function uploadFromBuffer(
  input: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
    upsert?: boolean;
    cacheControl?: string;
  },
  client?: Client
): Promise<ServiceResult<{ path: string; bucket: string; size: number }>> {
  const supabase = client ?? getSupabaseAdminClient();

  const file = new File([input.buffer as unknown as BlobPart], input.path, { type: input.contentType });

  try {
    const { error } = await supabase.storage
      .from(input.bucket)
      .upload(input.path, file, {
        upsert: input.upsert ?? false,
        cacheControl: input.cacheControl,
        contentType: input.contentType,
      });

    if (error) return fail(mapSupabaseError(error));

    return ok({ path: input.path, bucket: input.bucket, size: input.buffer.byteLength });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get the public URL for a public bucket object.
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = getSupabaseAdminClient().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Create a signed URL for private bucket access (time-limited).
 */
export async function createSignedUrl(
  input: { bucket: string; path: string; expiresInSeconds: number },
  client?: Client
): Promise<ServiceResult<{ signedUrl: string; expiresAt: string }>> {
  const supabase = client ?? getSupabaseAdminClient();

  try {
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .createSignedUrl(input.path, input.expiresInSeconds);

    if (error) return fail(mapSupabaseError(error));
    if (!data?.signedUrl) return fail(Errors.internal("Signed URL was not created."));

    return ok({
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000).toISOString(),
    });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * List files under a path prefix.
 */
export async function listFiles(
  input: { bucket: string; path?: string | null; limit?: number; offset?: number },
  client?: Client
): Promise<ServiceResult<{ name: string; path: string; size: number; updatedAt: string }[]>> {
  const supabase = client ?? getSupabaseAdminClient();

  try {
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .list(input.path ?? undefined, {
        limit: input.limit,
        offset: input.offset,
        sortBy: { column: "updated_at", order: "desc" },
      });

    if (error) return fail(mapSupabaseError(error));

    return ok(
      (data ?? []).map((file: { name: string; metadata?: { size?: number } | null; updated_at?: string | null }) => ({
        name: file.name,
        path: `${input.path ?? ""}${file.name}`,
        size: file.metadata?.size ?? 0,
        updatedAt: file.updated_at ?? new Date().toISOString(),
      }))
    );
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Bucket presets used by the platform
// ---------------------------------------------------------------------------

export const STORAGE_BUCKETS = {
  brandKits: "brand-kits",
  campaignAssets: "campaign-assets",
  deliverableSubmissions: "deliverable-submissions",
  exports: "integration-exports",
  contracts: "contracts",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Ensure all platform buckets exist with appropriate defaults.
 */
export async function ensurePlatformBuckets(client?: Client): Promise<ServiceResult<void>> {
  const buckets: Array<{ bucket: StorageBucket; options: BucketOption }> = [
    { bucket: STORAGE_BUCKETS.brandKits, options: { public: true, fileSizeLimit: 5 * 1024 * 1024 } },
    { bucket: STORAGE_BUCKETS.campaignAssets, options: { public: false, fileSizeLimit: 20 * 1024 * 1024 } },
    { bucket: STORAGE_BUCKETS.deliverableSubmissions, options: { public: false, fileSizeLimit: 100 * 1024 * 1024 } },
    { bucket: STORAGE_BUCKETS.exports, options: { public: false, fileSizeLimit: 50 * 1024 * 1024 } },
    { bucket: STORAGE_BUCKETS.contracts, options: { public: false, fileSizeLimit: 20 * 1024 * 1024 } },
  ];

  const errors: string[] = [];
  for (const b of buckets) {
    const result = await ensureBucket(b.bucket, b.options, client);
    if (result.error) errors.push(`${b.bucket}: ${result.error.message}`);
  }

  if (errors.length > 0) {
    return fail(Errors.internal("Some buckets could not be ensured.", new Error(errors.join("; "))));
  }
  return ok(undefined);
}
