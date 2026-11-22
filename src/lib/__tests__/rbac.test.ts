/**
 * CALLBACX TECHNOLOGY — Unit tests for RBAC (src/lib/rbac.ts)
 *
 * Pure logic tests: role definitions, permission grants, route access.
 * No database required.
 */

import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  BRAND_ROUTES,
  CREATOR_ROUTES,
  ADMIN_ROUTES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  getRolePermissions,
  getMissingPermissions,
  isBrandRole,
  isCreatorRole,
  isAdminRole,
  isPrivilegedRole,
  getDashboardRoute,
  type UserRole,
} from "@/lib/rbac";

describe("RBAC — permission definitions", () => {
  it("platform_admin has wildcard permission", () => {
    expect(ROLE_PERMISSIONS.platform_admin).toContain("*");
  });

  it("brand_owner has full campaign CRUD", () => {
    const perms = ROLE_PERMISSIONS.brand_owner;
    expect(perms).toContain(PERMISSIONS.campaigns.create);
    expect(perms).toContain(PERMISSIONS.campaigns.read);
    expect(perms).toContain(PERMISSIONS.campaigns.update);
    expect(perms).toContain(PERMISSIONS.campaigns.delete);
    expect(perms).toContain(PERMISSIONS.campaigns.publish);
  });

  it("brand_member cannot delete campaigns", () => {
    const perms = ROLE_PERMISSIONS.brand_member;
    expect(perms).not.toContain(PERMISSIONS.campaigns.delete);
    expect(perms).not.toContain(PERMISSIONS.campaigns.publish);
  });

  it("brand_finance cannot update campaigns", () => {
    const perms = ROLE_PERMISSIONS.brand_finance;
    expect(perms).not.toContain(PERMISSIONS.campaigns.update);
    expect(perms).not.toContain(PERMISSIONS.campaigns.create);
  });

  it("brand_viewer is read-only", () => {
    const perms = ROLE_PERMISSIONS.brand_viewer;
    const writePerms = [
      PERMISSIONS.campaigns.create,
      PERMISSIONS.campaigns.update,
      PERMISSIONS.campaigns.delete,
      PERMISSIONS.invoices.create,
      PERMISSIONS.invoices.update,
      PERMISSIONS.brand.update,
    ];
    writePerms.forEach((p) => expect(perms).not.toContain(p));
  });

  it("creator has profile + application + collaboration perms", () => {
    const perms = ROLE_PERMISSIONS.creator;
    expect(perms).toContain(PERMISSIONS.profile.read);
    expect(perms).toContain(PERMISSIONS.profile.update);
    expect(perms).toContain(PERMISSIONS.applications.create);
    expect(perms).toContain(PERMISSIONS.collaborations.read);
    expect(perms).toContain(PERMISSIONS.messages.send);
    expect(perms).toContain(PERMISSIONS.payouts.request);
  });

  it("creator cannot manage brand members or create campaigns", () => {
    const perms = ROLE_PERMISSIONS.creator;
    expect(perms).not.toContain(PERMISSIONS.campaigns.create);
    expect(perms).not.toContain(PERMISSIONS.brand.manage_members);
    expect(perms).not.toContain(PERMISSIONS.admin.users);
  });

  it("moderator has read-only + moderation perms", () => {
    const perms = ROLE_PERMISSIONS.moderator;
    expect(perms).toContain(PERMISSIONS.admin.moderation);
    expect(perms).toContain(PERMISSIONS.campaigns.read);
    expect(perms).toContain(PERMISSIONS.messages.read);
    expect(perms).not.toContain(PERMISSIONS.campaigns.update);
    expect(perms).not.toContain(PERMISSIONS.admin.users);
  });

  it("staff has read-only + admin read perms", () => {
    const perms = ROLE_PERMISSIONS.staff;
    expect(perms).toContain(PERMISSIONS.admin.users);
    expect(perms).toContain(PERMISSIONS.admin.brands);
    expect(perms).toContain(PERMISSIONS.campaigns.read);
    expect(perms).not.toContain(PERMISSIONS.campaigns.update);
    expect(perms).not.toContain(PERMISSIONS.admin.settings);
  });
});

describe("RBAC — hasPermission helpers", () => {
  it("hasPermission returns true for granted permission", () => {
    expect(hasPermission("brand_owner", PERMISSIONS.campaigns.delete)).toBe(true);
  });

  it("hasPermission returns false for ungranted permission", () => {
    expect(hasPermission("brand_member", PERMISSIONS.campaigns.delete)).toBe(false);
  });

  it("hasPermission returns true for wildcard (*)", () => {
    expect(hasPermission("platform_admin", "anything:at_all")).toBe(true);
  });

  it("hasAnyPermission returns true if any matches", () => {
    expect(
      hasAnyPermission("brand_member", [
        PERMISSIONS.campaigns.delete,
        PERMISSIONS.campaigns.read,
      ])
    ).toBe(true);
    expect(
      hasAnyPermission("brand_member", [
        PERMISSIONS.campaigns.delete,
        PERMISSIONS.campaigns.publish,
      ])
    ).toBe(false);
  });

  it("hasAllPermissions returns true only if all match", () => {
    expect(
      hasAllPermissions("brand_owner", [
        PERMISSIONS.campaigns.read,
        PERMISSIONS.campaigns.update,
      ])
    ).toBe(true);
    expect(
      hasAllPermissions("brand_member", [
        PERMISSIONS.campaigns.read,
        PERMISSIONS.campaigns.delete,
      ])
    ).toBe(false);
  });

  it("getRolePermissions returns empty array for unknown role", () => {
    expect(getRolePermissions("unknown_role" as UserRole)).toEqual([]);
  });

  it("getMissingPermissions returns missing perms", () => {
    const missing = getMissingPermissions("brand_member", [
      PERMISSIONS.campaigns.read,
      PERMISSIONS.campaigns.delete,
    ]);
    expect(missing).toEqual([PERMISSIONS.campaigns.delete]);
  });
});

describe("RBAC — route access", () => {
  it("brand_owner can access brand dashboard routes", () => {
    expect(canAccessRoute("brand_owner", "/dashboard/brand")).toBe(true);
    expect(canAccessRoute("brand_owner", "/dashboard/brand/settings")).toBe(true);
    expect(canAccessRoute("brand_owner", "/dashboard/brand/team")).toBe(true);
  });

  it("brand_member cannot access brand settings or team", () => {
    expect(canAccessRoute("brand_member", "/dashboard/brand/settings")).toBe(false);
    expect(canAccessRoute("brand_member", "/dashboard/brand/team")).toBe(false);
    expect(canAccessRoute("brand_member", "/dashboard/brand/campaigns")).toBe(true);
  });

  it("creator cannot access brand dashboard", () => {
    expect(canAccessRoute("creator", "/dashboard/brand/campaigns")).toBe(false);
    expect(canAccessRoute("creator", "/dashboard/creator/profile")).toBe(true);
  });

  it("creator cannot access admin routes", () => {
    expect(canAccessRoute("creator", "/dashboard/admin/users")).toBe(false);
    expect(canAccessRoute("creator", "/dashboard/admin/settings")).toBe(false);
  });

  it("platform_admin can access all admin routes", () => {
    expect(canAccessRoute("platform_admin", "/dashboard/admin/settings")).toBe(true);
    expect(canAccessRoute("platform_admin", "/dashboard/admin/integrations")).toBe(true);
    expect(canAccessRoute("platform_admin", "/dashboard/admin/activity-logs")).toBe(true);
  });

  it("staff cannot access admin settings (platform_admin only)", () => {
    expect(canAccessRoute("staff", "/dashboard/admin/settings")).toBe(false);
    expect(canAccessRoute("staff", "/dashboard/admin/users")).toBe(true);
  });

  it("moderator can access moderation routes", () => {
    expect(canAccessRoute("moderator", "/dashboard/admin/moderation")).toBe(true);
    expect(canAccessRoute("moderator", "/dashboard/admin/disputes")).toBe(true);
    expect(canAccessRoute("moderator", "/dashboard/admin/settings")).toBe(false);
  });

  it("unknown routes are allowed by default", () => {
    expect(canAccessRoute("creator", "/some/unknown/path")).toBe(true);
  });

  it("brand routes with dynamic segments match", () => {
    expect(canAccessRoute("brand_owner", "/dashboard/brand/campaigns/abc-123/edit")).toBe(true);
    expect(canAccessRoute("brand_viewer", "/dashboard/brand/campaigns/abc-123/edit")).toBe(false);
  });
});

describe("RBAC — role type guards", () => {
  it("isBrandRole detects brand roles", () => {
    expect(isBrandRole("brand_owner")).toBe(true);
    expect(isBrandRole("brand_member")).toBe(true);
    expect(isBrandRole("brand_viewer")).toBe(true);
    expect(isBrandRole("creator")).toBe(false);
    expect(isBrandRole("platform_admin")).toBe(false);
  });

  it("isCreatorRole detects creator", () => {
    expect(isCreatorRole("creator")).toBe(true);
    expect(isCreatorRole("brand_owner")).toBe(false);
  });

  it("isAdminRole detects admin/staff/moderator", () => {
    expect(isAdminRole("platform_admin")).toBe(true);
    expect(isAdminRole("moderator")).toBe(true);
    expect(isAdminRole("staff")).toBe(true);
    expect(isAdminRole("brand_owner")).toBe(false);
  });

  it("isPrivilegedRole detects platform_admin + brand_owner/admin", () => {
    expect(isPrivilegedRole("platform_admin")).toBe(true);
    expect(isPrivilegedRole("brand_owner")).toBe(true);
    expect(isPrivilegedRole("brand_admin")).toBe(true);
    expect(isPrivilegedRole("brand_member")).toBe(false);
    expect(isPrivilegedRole("creator")).toBe(false);
  });
});

describe("RBAC — dashboard route mapping", () => {
  it("brand roles map to brand dashboard", () => {
    ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"].forEach((r) => {
      expect(getDashboardRoute(r as UserRole)).toBe("/dashboard/brand");
    });
  });

  it("creator maps to creator dashboard", () => {
    expect(getDashboardRoute("creator")).toBe("/dashboard/creator");
  });

  it("admin roles map to admin dashboard", () => {
    ["platform_admin", "moderator", "staff"].forEach((r) => {
      expect(getDashboardRoute(r as UserRole)).toBe("/dashboard/admin");
    });
  });
});
