"use client";

import { useQuery, useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { demoData, isDemoMode } from "@/services/demo-data";
import type { Campaigns, CreatorProfiles, Collaborations, CampaignApplications, Profiles, BrandMembers } from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const queryKeys = {
  campaigns: {
    all: ["campaigns"] as const,
    brand: (brandId: string) => ["campaigns", "brand", brandId] as const,
    public: () => ["campaigns", "public"] as const,
    detail: (id: string) => ["campaigns", "detail", id] as const,
  },
  creators: {
    all: ["creators"] as const,
    profile: (profileId: string) => ["creators", "profile", profileId] as const,
    public: () => ["creators", "public"] as const,
  },
  collaborations: {
    all: ["collaborations"] as const,
    brand: (brandId: string) => ["collaborations", "brand", brandId] as const,
    creator: (creatorProfileId: string) => ["collaborations", "creator", creatorProfileId] as const,
  },
  applications: {
    all: ["applications"] as const,
    campaign: (campaignId: string) => ["applications", "campaign", campaignId] as const,
    creator: (creatorProfileId: string) => ["applications", "creator", creatorProfileId] as const,
  },
  profiles: {
    me: ["profiles", "me"] as const,
    detail: (id: string) => ["profiles", "detail", id] as const,
  },
  brandMembers: {
    profile: (profileId: string) => ["brandMembers", "profile", profileId] as const,
  },
  creatorProfiles: {
    profile: (profileId: string) => ["creatorProfiles", "profile", profileId] as const,
  },
  invoices: {
    all: ["invoices"] as const,
    brand: (brandId: string) => ["invoices", "brand", brandId] as const,
  },
  conversations: {
    all: ["conversations"] as const,
    brand: (brandId: string) => ["conversations", "brand", brandId] as const,
    creator: (creatorProfileId: string) => ["conversations", "creator", creatorProfileId] as const,
  },
  analytics: {
    campaign: (campaignId: string) => ["analytics", "campaign", campaignId] as const,
    creator: (creatorProfileId: string) => ["analytics", "creator", creatorProfileId] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Demo Mode Helpers
// ---------------------------------------------------------------------------

function isDemo(): boolean {
  return isDemoMode;
}

// ---------------------------------------------------------------------------
// Campaign Hooks
// ---------------------------------------------------------------------------

export function useCampaigns(brandId?: string) {
  return useQuery({
    queryKey: brandId ? queryKeys.campaigns.brand(brandId) : queryKeys.campaigns.all,
    queryFn: async () => {
      if (isDemo() && brandId) {
        return demoData.campaigns.filter(c => c.brand_id === brandId);
      }
      if (isDemo()) {
        return demoData.campaigns;
      }
      const supabase = getSupabaseClient();
      const query = supabase.from("campaigns").select("*");
      if (brandId) query.eq("brand_id", brandId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !brandId || !!brandId,
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: async () => {
      if (isDemo()) {
        return demoData.campaigns.find(c => c.id === id) ?? null;
      }
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function usePublicCampaigns() {
  return useQuery({
    queryKey: queryKeys.campaigns.public(),
    queryFn: async () => {
      if (isDemo()) {
        return demoData.campaigns.filter(c => 
          (c.status === "published" || c.status === "active") && 
          c.visibility === "public" &&
          c.is_active
        );
      }
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .in("status", ["published", "active"])
        .eq("visibility", "public")
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------------
// Creator Hooks
// ---------------------------------------------------------------------------

export function useCreatorProfile(profileId?: string) {
  return useQuery({
    queryKey: profileId ? queryKeys.creators.profile(profileId) : queryKeys.creators.all,
    queryFn: async () => {
      if (isDemo() && profileId) {
        return demoData.creatorProfiles.find(c => c.profile_id === profileId) ?? null;
      }
      if (!profileId) return null;
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
}

export function usePublicCreators() {
  return useQuery({
    queryKey: queryKeys.creators.public(),
    queryFn: async () => {
      if (isDemo()) {
        return demoData.creatorProfiles.filter(c => c.is_active);
      }
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------------
// Collaboration Hooks
// ---------------------------------------------------------------------------

export function useCollaborations(brandId?: string, creatorProfileId?: string) {
  return useQuery({
    queryKey: brandId 
      ? queryKeys.collaborations.brand(brandId) 
      : creatorProfileId 
        ? queryKeys.collaborations.creator(creatorProfileId) 
        : queryKeys.collaborations.all,
    queryFn: async () => {
      if (isDemo() && brandId) {
        return demoData.collaborations.filter(c => c.brand_id === brandId);
      }
      if (isDemo() && creatorProfileId) {
        return demoData.collaborations.filter(c => c.creator_profile_id === creatorProfileId);
      }
      if (isDemo()) {
        return demoData.collaborations;
      }
      const supabase = getSupabaseClient();
      const query = supabase.from("collaborations").select("*");
      if (brandId) query.eq("brand_id", brandId);
      if (creatorProfileId) query.eq("creator_profile_id", creatorProfileId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !brandId && !creatorProfileId || !!brandId || !!creatorProfileId,
  });
}

// ---------------------------------------------------------------------------
// Application Hooks
// ---------------------------------------------------------------------------

export function useCampaignApplications(campaignId?: string, creatorProfileId?: string) {
  return useQuery({
    queryKey: campaignId 
      ? queryKeys.applications.campaign(campaignId) 
      : creatorProfileId 
        ? queryKeys.applications.creator(creatorProfileId) 
        : queryKeys.applications.all,
    queryFn: async () => {
      if (isDemo() && campaignId) {
        return demoData.campaignApplications.filter(a => a.campaign_id === campaignId);
      }
      if (isDemo() && creatorProfileId) {
        return demoData.campaignApplications.filter(a => a.creator_profile_id === creatorProfileId);
      }
      if (isDemo()) {
        return demoData.campaignApplications;
      }
      const supabase = getSupabaseClient();
      const query = supabase.from("campaign_applications").select("*");
      if (campaignId) query.eq("campaign_id", campaignId);
      if (creatorProfileId) query.eq("creator_profile_id", creatorProfileId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !campaignId && !creatorProfileId || !!campaignId || !!creatorProfileId,
  });
}

// ---------------------------------------------------------------------------
// Profile Hooks
// ---------------------------------------------------------------------------

export function useProfile(profileId?: string) {
  return useQuery({
    queryKey: profileId ? queryKeys.profiles.detail(profileId) : queryKeys.profiles.me,
    queryFn: async () => {
      if (isDemo() && profileId) {
        // Find profile by id in demo data (not directly available, return mock)
        return { id: profileId, email: "demo@example.com", full_name: "Demo User" } as any;
      }
      const supabase = getSupabaseClient();
      if (profileId) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      // Get current user's profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !profileId || !!profileId,
  });
}

// ---------------------------------------------------------------------------
// Brand Member Hooks
// ---------------------------------------------------------------------------

export function useBrandMember(profileId?: string) {
  return useQuery({
    queryKey: profileId ? queryKeys.brandMembers.profile(profileId) : [],
    queryFn: async () => {
      if (isDemo() && profileId) {
        return demoData.brandMembers?.find((b: any) => b.profile_id === profileId) ?? null;
      }
      if (!profileId) return null;
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("brand_members")
        .select("*")
        .eq("profile_id", profileId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
}

// ---------------------------------------------------------------------------
// Creator Profile (for role check) Hooks
// ---------------------------------------------------------------------------

export function useCreatorProfileRole(profileId?: string) {
  return useQuery({
    queryKey: profileId ? queryKeys.creatorProfiles.profile(profileId) : [],
    queryFn: async () => {
      if (isDemo() && profileId) {
        return demoData.creatorProfiles.find(c => c.profile_id === profileId) ?? null;
      }
      if (!profileId) return null;
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
}

// ---------------------------------------------------------------------------
// Invoice Hooks
// ---------------------------------------------------------------------------

export function useInvoices(brandId?: string) {
  return useQuery({
    queryKey: brandId ? queryKeys.invoices.brand(brandId) : queryKeys.invoices.all,
    queryFn: async () => {
      if (isDemo() && brandId) {
        return demoData.invoices.filter(i => i.brand_id === brandId);
      }
      if (isDemo()) {
        return demoData.invoices;
      }
      const supabase = getSupabaseClient();
      const query = supabase.from("invoices").select("*");
      if (brandId) query.eq("brand_id", brandId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !brandId || !!brandId,
  });
}

// ---------------------------------------------------------------------------
// Conversation Hooks
// ---------------------------------------------------------------------------

export function useConversations(brandId?: string, creatorProfileId?: string) {
  return useQuery({
    queryKey: brandId 
      ? queryKeys.conversations.brand(brandId) 
      : creatorProfileId 
        ? queryKeys.conversations.creator(creatorProfileId) 
        : queryKeys.conversations.all,
    queryFn: async () => {
      if (isDemo() && brandId) {
        return demoData.conversations.filter(c => c.created_by === brandId);
      }
      if (isDemo() && creatorProfileId) {
        // For creator, find conversations they're part of
        return demoData.conversations;
      }
      if (isDemo()) {
        return demoData.conversations;
      }
      const supabase = getSupabaseClient();
      const query = supabase.from("conversations").select("*");
      if (brandId) query.eq("created_by", brandId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !brandId && !creatorProfileId || !!brandId || !!creatorProfileId,
  });
}

// ---------------------------------------------------------------------------
// Analytics Hooks
// ---------------------------------------------------------------------------

export function useCampaignAnalytics(campaignId?: string) {
  return useQuery({
    queryKey: campaignId ? queryKeys.analytics.campaign(campaignId) : [],
    queryFn: async () => {
      if (isDemo() && campaignId) {
        return demoData.campaignAnalytics.filter(a => a.campaign_id === campaignId);
      }
      if (!campaignId) return [];
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("campaign_analytics")
        .select("*")
        .eq("campaign_id", campaignId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!campaignId,
  });
}

export function useCreatorAnalytics(creatorProfileId?: string) {
  return useQuery({
    queryKey: creatorProfileId ? queryKeys.analytics.creator(creatorProfileId) : [],
    queryFn: async () => {
      if (isDemo() && creatorProfileId) {
        return demoData.creatorAnalytics.filter(a => a.creator_profile_id === creatorProfileId);
      }
      if (!creatorProfileId) return [];
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("creator_analytics")
        .select("*")
        .eq("creator_profile_id", creatorProfileId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!creatorProfileId,
  });
}

// ---------------------------------------------------------------------------
// Mutation Helpers
// ---------------------------------------------------------------------------

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidateCampaigns: (brandId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      if (brandId) queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.brand(brandId) });
    },
    invalidateCollaborations: (brandId?: string, creatorProfileId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.all });
      if (brandId) queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.brand(brandId) });
      if (creatorProfileId) queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.creator(creatorProfileId) });
    },
    invalidateApplications: (campaignId?: string, creatorProfileId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      if (campaignId) queryClient.invalidateQueries({ queryKey: queryKeys.applications.campaign(campaignId) });
      if (creatorProfileId) queryClient.invalidateQueries({ queryKey: queryKeys.applications.creator(creatorProfileId) });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}

// ---------------------------------------------------------------------------
// Prefetch Helpers (for SSR/prefetching)
// ---------------------------------------------------------------------------

export async function prefetchCampaigns(queryClient: any, brandId: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.campaigns.brand(brandId),
    queryFn: async () => {
      if (isDemo()) {
        return demoData.campaigns.filter(c => c.brand_id === brandId);
      }
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("brand_id", brandId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function prefetchCollaborations(queryClient: any, brandId: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.collaborations.brand(brandId),
    queryFn: async () => {
      if (isDemo()) {
        return demoData.collaborations.filter(c => c.brand_id === brandId);
      }
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("collaborations")
        .select("*")
        .eq("brand_id", brandId);
      if (error) throw error;
      return data ?? [];
    },
  });
}