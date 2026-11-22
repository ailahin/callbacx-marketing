"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Profiles, UserRoles, Permissions, ProfileUserRoles } from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 
  | "brand_owner" 
  | "brand_admin" 
  | "brand_member" 
  | "brand_finance" 
  | "brand_viewer"
  | "creator"
  | "platform_admin"
  | "moderator"
  | "staff";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  role: UserRole;
  permissions: string[];
  brand_id: string | null;
  creator_profile_id: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  session: { access_token: string; expires_at: number } | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (data: Partial<Pick<AuthUser, "full_name" | "headline" | "avatar_url">>) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isBrandMember: () => boolean;
  isCreator: () => boolean;
  isPlatformAdmin: () => boolean;
}

// ---------------------------------------------------------------------------
// Demo mode detection
// ---------------------------------------------------------------------------

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ---------------------------------------------------------------------------
// Demo Users (clearly separated from production)
// ---------------------------------------------------------------------------

const DEMO_USERS: Record<string, AuthUser> = {
  "brand@demo.com": {
    id: "demo-brand-1",
    email: "brand@demo.com",
    full_name: "Acme Corporation",
    avatar_url: null,
    headline: "Leading innovative solutions since 2010",
    role: "brand_owner",
    permissions: [
      "campaigns:create",
      "campaigns:read",
      "campaigns:update",
      "campaigns:delete",
      "campaigns:publish",
      "creators:read",
      "creators:invite",
      "applications:read",
      "applications:manage",
      "collaborations:read",
      "collaborations:manage",
      "messages:read",
      "messages:send",
      "invoices:read",
      "invoices:create",
      "payments:read",
      "analytics:read",
      "brand:update",
      "brand:manage_members",
    ],
    brand_id: "demo-brand-1",
    creator_profile_id: null,
  },
  "creator@demo.com": {
    id: "demo-creator-1",
    email: "creator@demo.com",
    full_name: "Alex Creator",
    avatar_url: null,
    headline: "Lifestyle & Tech Content Creator | 500K+ followers",
    role: "creator",
    permissions: [
      "profile:read",
      "profile:update",
      "social_accounts:read",
      "social_accounts:manage",
      "portfolio:read",
      "portfolio:manage",
      "campaigns:browse",
      "campaigns:apply",
      "applications:read",
      "applications:manage",
      "collaborations:read",
      "collaborations:manage",
      "deliverables:read",
      "deliverables:submit",
      "messages:read",
      "messages:send",
      "earnings:read",
      "payouts:read",
    ],
    brand_id: null,
    creator_profile_id: "demo-creator-profile-1",
  },
  "admin@demo.com": {
    id: "demo-admin-1",
    email: "admin@demo.com",
    full_name: "Platform Admin",
    avatar_url: null,
    headline: "CALLBACX TECHNOLOGY Platform Administrator",
    role: "platform_admin",
    permissions: ["*"],
    brand_id: null,
    creator_profile_id: null,
  },
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const supabase = getSupabaseClient();

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  const fetchUserProfile = useCallback(async (userId: string): Promise<AuthUser | null> => {
    if (isDemoMode) {
      // In demo mode, return mock data based on email
      const demoUser = Object.values(DEMO_USERS).find(u => u.id === userId);
      return demoUser || null;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single() as { data: any; error: any };

      if (error || !profile) return null;

      // Fetch user roles
      const { data: userRoles } = await supabase
        .from("profile_user_roles")
        .select(`
          role:user_roles (
            slug,
            name,
            permissions:role_permissions (
              permission:permissions ( slug )
            )
          )
        `)
        .eq("profile_id", userId) as { data: any[] | null; error: any };

      // Fetch brand membership
      const { data: brandMember } = await supabase
        .from("brand_members")
        .select("brand_id, role")
        .eq("profile_id", userId)
        .eq("is_active", true)
        .maybeSingle() as { data: any; error: any };

      // Fetch creator profile
      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      const roles = userRoles?.map(ur => ur.role).filter(Boolean) || [];
      const permissions = roles.flatMap(r => r.permissions?.map(p => p.permission?.slug).filter(Boolean) || []);
      const roleSlugs = roles.map(r => r.slug);

      // Determine primary role
      let primaryRole: UserRole = "creator";
      if (roleSlugs.includes("platform_admin")) primaryRole = "platform_admin";
      else if (roleSlugs.includes("moderator")) primaryRole = "moderator";
      else if (roleSlugs.includes("staff")) primaryRole = "staff";
      else if (brandMember) {
        const brandRoleMap: Record<string, UserRole> = {
          owner: "brand_owner",
          admin: "brand_admin",
          member: "brand_member",
          finance: "brand_finance",
          viewer: "brand_viewer",
        };
        primaryRole = brandRoleMap[brandMember.role] || "brand_member";
      } else if (creatorProfile) {
        primaryRole = "creator";
      }

      return {
        id: profile.id,
        email: profile.email || "",
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        headline: profile.headline,
        role: primaryRole,
        permissions,
        brand_id: brandMember?.brand_id || null,
        creator_profile_id: creatorProfile?.id || null,
      };
    } catch {
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (isDemoMode) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setState(prev => ({
          ...prev,
          user: userProfile,
          session: {
            access_token: session.access_token,
            expires_at: session.expires_at || 0,
          },
          loading: false,
        }));
      } else {
        setState(prev => ({ ...prev, user: null, session: null, loading: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error, loading: false }));
    }
  }, [fetchUserProfile]);

  // ---------------------------------------------------------------------------
  // Auth Listeners
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isDemoMode) {
      // Demo mode: auto-login first demo user for testing
      const demoUser = DEMO_USERS["brand@demo.com"];
      setState({
        user: demoUser,
        session: { access_token: "demo-token", expires_at: Date.now() + 3600000 },
        loading: false,
        error: null,
      });
      return;
    }

    // Initial session check
    refreshSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setState(prev => ({
          ...prev,
          user: userProfile,
          session: {
            access_token: session.access_token,
            expires_at: session.expires_at || 0,
          },
          loading: false,
        }));
      } else {
        setState(prev => ({ ...prev, user: null, session: null, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, refreshSession]);

  // ---------------------------------------------------------------------------
  // Auth Actions
  // ---------------------------------------------------------------------------

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (isDemoMode) {
      const demoUser = DEMO_USERS[email];
      if (demoUser && password === "demo123") {
        setState({
          user: demoUser,
          session: { access_token: "demo-token", expires_at: Date.now() + 3600000 },
          loading: false,
          error: null,
        });
        return { error: null };
      }
      const error = new Error("Invalid demo credentials. Use brand@demo.com, creator@demo.com, or admin@demo.com with password 'demo123'");
      setState(prev => ({ ...prev, loading: false, error }));
      return { error };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, loading: false, error: err }));
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (isDemoMode) {
      const error = new Error("Demo mode: sign up is disabled. Use demo credentials.");
      setState(prev => ({ ...prev, loading: false, error }));
      return { error };
    }

    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, loading: false, error: err }));
      return { error: err };
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      setState({ user: null, session: null, loading: false, error: null });
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const resetPassword = async (email: string) => {
    if (isDemoMode) {
      return { error: new Error("Demo mode: password reset is disabled.") };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (isDemoMode) {
      return { error: new Error("Demo mode: password update is disabled.") };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateProfile = async (data: Partial<Pick<AuthUser, "full_name" | "headline" | "avatar_url">>) => {
    if (isDemoMode || !state.user) {
      return { error: new Error("Cannot update profile in demo mode or when not logged in") };
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(data as any)
        .eq("id", state.user.id);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null,
      }));

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // ---------------------------------------------------------------------------
  // Permission Helpers
  // ---------------------------------------------------------------------------

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!state.user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    if (state.user.permissions.includes("*")) return true;
    return state.user.permissions.includes(permission);
  };

  const isBrandMember = (): boolean => {
    return state.user?.role.startsWith("brand_") || false;
  };

  const isCreator = (): boolean => {
    return state.user?.role === "creator";
  };

  const isPlatformAdmin = (): boolean => {
    return state.user?.role === "platform_admin";
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    hasRole,
    hasPermission,
    isBrandMember,
    isCreator,
    isPlatformAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}

export function usePermissions() {
  const { user, hasPermission, hasRole, isBrandMember, isCreator, isPlatformAdmin } = useAuth();
  return { permissions: user?.permissions || [], hasPermission, hasRole, isBrandMember, isCreator, isPlatformAdmin };
}

// ---------------------------------------------------------------------------
// Demo mode helper
// ---------------------------------------------------------------------------

export function useDemoMode() {
  return isDemoMode;
}

export { DEMO_USERS };
export { isDemoMode };

