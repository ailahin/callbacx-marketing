/**
 * CALLBACX MARKETING — Auth routing helpers
 *
 * Centralizes post-login/post-register destination logic and protects against
 * open-redirects by only allowing same-origin, internal paths.
 */

import type { UserRole } from "@/context/AuthProvider";

/**
 * Map a user's primary role to their default landing dashboard.
 * Falls back to the creator dashboard for unknown roles.
 */
export function defaultDashboardForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "platform_admin":
    case "moderator":
    case "staff":
      return "/dashboard/admin";
    case "brand_owner":
    case "brand_admin":
    case "brand_member":
    case "brand_finance":
    case "brand_viewer":
      return "/dashboard/brand/overview";
    case "creator":
    default:
      return "/dashboard/creator/overview";
  }
}

/**
 * Resolve a safe redirect target.
 *
 * Accepts an untrusted `redirect` query param and returns a trusted internal
 * path. Any absolute URL, protocol-relative URL, or non-root path is rejected
 * in favor of the provided fallback. This prevents open-redirect attacks.
 */
export function sanitizeRedirectPath(
  redirect: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!redirect || typeof redirect !== "string") return fallback;

  const value = redirect.trim();
  if (value === "") return fallback;

  // Reject protocol-relative (//evil.com) and any absolute URLs.
  if (value.startsWith("//")) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) return fallback;

  // Must be an internal absolute path.
  if (!value.startsWith("/")) return fallback;

  // Reject path traversal attempts that escape root.
  if (value.includes("/../") || value === "/.." || value.includes("\\")) return fallback;

  return value;
}