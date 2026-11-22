/**
 * CALLBACX MARKETING â€” Database service layer
 *
 * UI-independent helpers for common data access patterns.
 * All queries rely on RLS: the caller's auth.uid() is trusted; we never pass
 * user-supplied ids as ownership claims. Privileged operations (payments,
 * webhooks, moderation) must use getSupabaseAdminClient() in server code only.
 *
 * These services are intentionally thin wrappers over supabase-js so they can
 * be reused by the future Expo/React Native app against the same backend.
 */

import type {
  Campaigns,
  CampaignStatus,
  Collaborations,
  CreatorProfiles,
  Profiles,
} from "@/lib/supabase/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";

type Client = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getMyProfile(client: Client): Promise<Profiles | null> {
  const { data, error } = await client.from("profiles").select("*").single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(
  client: Client,
  patch: Partial<Pick<Profiles, "full_name" | "headline" | "bio" | "location" | "website_url" | "avatar_url">>
): Promise<Profiles> {
  // supabase-js's generated Update generic resolves to `never` for Partial<Pick<...>>
  // even when structurally compatible, so we bypass the typed builder at this call site.
  const builder = client.from("profiles") as unknown as {
    update: (values: unknown) => {
      select: (cols: string) => {
        single: () => Promise<{ data: Profiles | null; error: { message: string } | null }>;
      };
    };
  };
  const { data, error } = await builder.update(patch).select("*").single();
  if (error) throw error;
  return data as Profiles;
}

// ---------------------------------------------------------------------------
// Creator profiles
// ---------------------------------------------------------------------------

export async function getCreatorProfile(client: Client, id: string): Promise<CreatorProfiles | null> {
  const { data, error } = await client.from("creator_profiles").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }
  return data;
}

export async function listPublicCreators(
  client: Client,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<CreatorProfiles[]> {
  const { data, error } = await client
    .from("creator_profiles")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export async function listPublishedCampaigns(
  client: Client,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<Campaigns[]> {
  const { data, error } = await client
    .from("campaigns")
    .select("*")
    .eq("status", "published" satisfies CampaignStatus)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}

export async function getCampaign(client: Client, id: string): Promise<Campaigns | null> {
  const { data, error } = await client.from("campaigns").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Collaborations
// ---------------------------------------------------------------------------

export async function listMyCollaborations(
  client: Client,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<Collaborations[]> {
  const { data, error } = await client
    .from("collaborations")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function listConversationMessages(
  client: Client,
  conversationId: string,
  { limit = 50, before }: { limit?: number; before?: string } = {}
) {
  let query = client
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("created_at", before);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

export interface Page<T> {
  items: T[];
  hasMore: boolean;
  nextOffset: number;
}

export function makePage<T>(items: T[], limit: number, offset: number): Page<T> {
  return {
    items,
    hasMore: items.length === limit,
    nextOffset: offset + limit,
  };
}

