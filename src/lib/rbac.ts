/**
 * CALLBACX TECHNOLOGY â€” Role-Based Access Control (RBAC)
 *
 * Centralized permission definitions and route protection logic.
 * All permissions mirror the database schema in supabase/migrations/0002_identity.sql
 */

// ---------------------------------------------------------------------------
// Permission Definitions
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  // Campaign permissions
  campaigns: {
    create: "campaigns:create",
    read: "campaigns:read",
    update: "campaigns:update",
    delete: "campaigns:delete",
    publish: "campaigns:publish",
    manage_deliverables: "campaigns:manage_deliverables",
    manage_budget: "campaigns:manage_budget",
    view_analytics: "campaigns:view_analytics",
  },

  // Creator permissions
  creators: {
    read: "creators:read",
    invite: "creators:invite",
    manage: "creators:manage",
    view_rates: "creators:view_rates",
    view_analytics: "creators:view_analytics",
  },

  // Application permissions
  applications: {
    read: "applications:read",
    create: "applications:create",
    update: "applications:update",
    delete: "applications:delete",
    manage: "applications:manage", // review, accept, reject
  },

  // Collaboration permissions
  collaborations: {
    read: "collaborations:read",
    create: "collaborations:create",
    update: "collaborations:update",
    delete: "collaborations:delete",
    manage: "collaborations:manage", // status changes, contracts
    manage_deliverables: "collaborations:manage_deliverables",
    approve_deliverables: "collaborations:approve_deliverables",
  },

  // Message permissions
  messages: {
    read: "messages:read",
    send: "messages:send",
    delete: "messages:delete",
    manage_conversations: "messages:manage_conversations",
  },

  // Invoice/Payment permissions
  invoices: {
    read: "invoices:read",
    create: "invoices:create",
    update: "invoices:update",
    delete: "invoices:delete",
    send: "invoices:send",
    mark_paid: "invoices:mark_paid",
  },

  payments: {
    read: "payments:read",
    create: "payments:create",
    refund: "payments:refund",
    view_history: "payments:view_history",
  },

  // Analytics permissions
  analytics: {
    read: "analytics:read",
    export: "analytics:export",
    view_revenue: "analytics:view_revenue",
    view_engagement: "analytics:view_engagement",
  },

  // Brand permissions
  brand: {
    read: "brand:read",
    update: "brand:update",
    manage_members: "brand:manage_members",
    manage_billing: "brand:manage_billing",
    manage_verification: "brand:manage_verification",
    delete: "brand:delete",
  },

  // Creator profile permissions
  profile: {
    read: "profile:read",
    update: "profile:update",
    manage_social: "profile:manage_social",
    manage_portfolio: "profile:manage_portfolio",
    manage_rates: "profile:manage_rates",
    manage_availability: "profile:manage_availability",
  },

  // Platform admin permissions
  admin: {
    users: "admin:users",
    brands: "admin:brands",
    creators: "admin:creators",
    campaigns: "admin:campaigns",
    payments: "admin:payments",
    analytics: "admin:analytics",
    settings: "admin:settings",
    moderation: "admin:moderation",
  },

  // Earnings/Payout permissions (creator side)
  earnings: {
    read: "earnings:read",
    view_history: "earnings:view_history",
    export: "earnings:export",
  },

  payouts: {
    read: "payouts:read",
    request: "payouts:request",
    view_history: "payouts:view_history",
  },
} as const;

// ---------------------------------------------------------------------------
// Role Definitions
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

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  brand_owner: [
    // Full campaign access
    PERMISSIONS.campaigns.create,
    PERMISSIONS.campaigns.read,
    PERMISSIONS.campaigns.update,
    PERMISSIONS.campaigns.delete,
    PERMISSIONS.campaigns.publish,
    PERMISSIONS.campaigns.manage_deliverables,
    PERMISSIONS.campaigns.manage_budget,
    PERMISSIONS.campaigns.view_analytics,
    // Full creator access
    PERMISSIONS.creators.read,
    PERMISSIONS.creators.invite,
    PERMISSIONS.creators.manage,
    PERMISSIONS.creators.view_rates,
    PERMISSIONS.creators.view_analytics,
    // Full application access
    PERMISSIONS.applications.read,
    PERMISSIONS.applications.create,
    PERMISSIONS.applications.update,
    PERMISSIONS.applications.delete,
    PERMISSIONS.applications.manage,
    // Full collaboration access
    PERMISSIONS.collaborations.read,
    PERMISSIONS.collaborations.create,
    PERMISSIONS.collaborations.update,
    PERMISSIONS.collaborations.delete,
    PERMISSIONS.collaborations.manage,
    PERMISSIONS.collaborations.manage_deliverables,
    PERMISSIONS.collaborations.approve_deliverables,
    // Full message access
    PERMISSIONS.messages.read,
    PERMISSIONS.messages.send,
    PERMISSIONS.messages.delete,
    PERMISSIONS.messages.manage_conversations,
    // Full invoice/payment access
    PERMISSIONS.invoices.read,
    PERMISSIONS.invoices.create,
    PERMISSIONS.invoices.update,
    PERMISSIONS.invoices.delete,
    PERMISSIONS.invoices.send,
    PERMISSIONS.invoices.mark_paid,
    PERMISSIONS.payments.read,
    PERMISSIONS.payments.create,
    PERMISSIONS.payments.refund,
    PERMISSIONS.payments.view_history,
    // Full analytics
    PERMISSIONS.analytics.read,
    PERMISSIONS.analytics.export,
    PERMISSIONS.analytics.view_revenue,
    PERMISSIONS.analytics.view_engagement,
    // Full brand management
    PERMISSIONS.brand.read,
    PERMISSIONS.brand.update,
    PERMISSIONS.brand.manage_members,
    PERMISSIONS.brand.manage_billing,
    PERMISSIONS.brand.manage_verification,
    PERMISSIONS.brand.delete,
  ],

  brand_admin: [
    // Campaign access (no delete)
    PERMISSIONS.campaigns.create,
    PERMISSIONS.campaigns.read,
    PERMISSIONS.campaigns.update,
    PERMISSIONS.campaigns.publish,
    PERMISSIONS.campaigns.manage_deliverables,
    PERMISSIONS.campaigns.manage_budget,
    PERMISSIONS.campaigns.view_analytics,
    // Creator access
    PERMISSIONS.creators.read,
    PERMISSIONS.creators.invite,
    PERMISSIONS.creators.view_rates,
    PERMISSIONS.creators.view_analytics,
    // Application access
    PERMISSIONS.applications.read,
    PERMISSIONS.applications.manage,
    // Collaboration access
    PERMISSIONS.collaborations.read,
    PERMISSIONS.collaborations.create,
    PERMISSIONS.collaborations.update,
    PERMISSIONS.collaborations.manage,
    PERMISSIONS.collaborations.manage_deliverables,
    PERMISSIONS.collaborations.approve_deliverables,
    // Message access
    PERMISSIONS.messages.read,
    PERMISSIONS.messages.send,
    PERMISSIONS.messages.manage_conversations,
    // Invoice/payment access
    PERMISSIONS.invoices.read,
    PERMISSIONS.invoices.create,
    PERMISSIONS.invoices.update,
    PERMISSIONS.invoices.send,
    PERMISSIONS.invoices.mark_paid,
    PERMISSIONS.payments.read,
    PERMISSIONS.payments.view_history,
    // Analytics
    PERMISSIONS.analytics.read,
    PERMISSIONS.analytics.export,
    PERMISSIONS.analytics.view_revenue,
    PERMISSIONS.analytics.view_engagement,
    // Brand management (limited)
    PERMISSIONS.brand.read,
    PERMISSIONS.brand.update,
    PERMISSIONS.brand.manage_members,
    PERMISSIONS.brand.manage_verification,
  ],

  brand_member: [
    // Campaign read + create drafts
    PERMISSIONS.campaigns.read,
    PERMISSIONS.campaigns.create,
    PERMISSIONS.campaigns.update,
    PERMISSIONS.campaigns.view_analytics,
    // Creator access
    PERMISSIONS.creators.read,
    PERMISSIONS.creators.invite,
    PERMISSIONS.creators.view_rates,
    // Application access
    PERMISSIONS.applications.read,
    PERMISSIONS.applications.manage,
    // Collaboration access
    PERMISSIONS.collaborations.read,
    PERMISSIONS.collaborations.create,
    PERMISSIONS.collaborations.update,
    PERMISSIONS.collaborations.manage_deliverables,
    // Message access
    PERMISSIONS.messages.read,
    PERMISSIONS.messages.send,
    // Invoice access
    PERMISSIONS.invoices.read,
    PERMISSIONS.invoices.create,
    // Analytics
    PERMISSIONS.analytics.read,
    PERMISSIONS.analytics.view_engagement,
    // Brand read
    PERMISSIONS.brand.read,
  ],

  brand_finance: [
    // Limited campaign access
    PERMISSIONS.campaigns.read,
    PERMISSIONS.campaigns.view_analytics,
    // Invoice/payment full access
    PERMISSIONS.invoices.read,
    PERMISSIONS.invoices.create,
    PERMISSIONS.invoices.update,
    PERMISSIONS.invoices.send,
    PERMISSIONS.invoices.mark_paid,
    PERMISSIONS.payments.read,
    PERMISSIONS.payments.create,
    PERMISSIONS.payments.refund,
    PERMISSIONS.payments.view_history,
    // Analytics
    PERMISSIONS.analytics.read,
    PERMISSIONS.analytics.export,
    PERMISSIONS.analytics.view_revenue,
    // Brand billing
    PERMISSIONS.brand.read,
    PERMISSIONS.brand.manage_billing,
  ],

  brand_viewer: [
    PERMISSIONS.campaigns.read,
    PERMISSIONS.campaigns.view_analytics,
    PERMISSIONS.creators.read,
    PERMISSIONS.applications.read,
    PERMISSIONS.collaborations.read,
    PERMISSIONS.messages.read,
    PERMISSIONS.invoices.read,
    PERMISSIONS.payments.read,
    PERMISSIONS.analytics.read,
    PERMISSIONS.analytics.view_engagement,
    PERMISSIONS.brand.read,
  ],

  creator: [
    // Profile management
    PERMISSIONS.profile.read,
    PERMISSIONS.profile.update,
    PERMISSIONS.profile.manage_social,
    PERMISSIONS.profile.manage_portfolio,
    PERMISSIONS.profile.manage_rates,
    PERMISSIONS.profile.manage_availability,
    // Campaign browsing
    PERMISSIONS.campaigns.read,
    // Application management
    PERMISSIONS.applications.read,
    PERMISSIONS.applications.create,
    PERMISSIONS.applications.update,
    PERMISSIONS.applications.delete,
    // Collaboration management
    PERMISSIONS.collaborations.read,
    PERMISSIONS.collaborations.update,
    PERMISSIONS.collaborations.manage_deliverables,
    // Message access
    PERMISSIONS.messages.read,
    PERMISSIONS.messages.send,
    // Earnings
    PERMISSIONS.earnings.read,
    PERMISSIONS.earnings.view_history,
    PERMISSIONS.earnings.export,
    PERMISSIONS.payouts.read,
    PERMISSIONS.payouts.request,
    PERMISSIONS.payouts.view_history,
  ],

  platform_admin: ["*"],

  moderator: [
    PERMISSIONS.admin.moderation,
    PERMISSIONS.creators.read,
    PERMISSIONS.campaigns.read,
    PERMISSIONS.applications.read,
    PERMISSIONS.collaborations.read,
    PERMISSIONS.messages.read,
  ],

  staff: [
    PERMISSIONS.admin.users,
    PERMISSIONS.admin.brands,
    PERMISSIONS.admin.creators,
    PERMISSIONS.admin.campaigns,
    PERMISSIONS.admin.analytics,
    PERMISSIONS.creators.read,
    PERMISSIONS.campaigns.read,
    PERMISSIONS.applications.read,
    PERMISSIONS.collaborations.read,
    PERMISSIONS.messages.read,
    PERMISSIONS.invoices.read,
    PERMISSIONS.payments.read,
  ],
};

// ---------------------------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------------------------

export interface RouteConfig {
  path: string;
  roles: UserRole[];
  permissions?: string[];
  redirectTo?: string;
}

export const BRAND_ROUTES: RouteConfig[] = [
  { path: "/dashboard/brand", roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
  { path: "/dashboard/brand/overview", roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
  { path: "/dashboard/brand/campaigns", roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
  { path: "/dashboard/brand/campaigns/new", roles: ["brand_owner", "brand_admin", "brand_member"] },
  { path: "/dashboard/brand/campaigns/:id", roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
  { path: "/dashboard/brand/campaigns/:id/edit", roles: ["brand_owner", "brand_admin", "brand_member"] },
  { path: "/dashboard/brand/creators", roles: ["brand_owner", "brand_admin", "brand_member", "brand_viewer"] },
  { path: "/dashboard/brand/creators/:id", roles: ["brand_owner", "brand_admin", "brand_member", "brand_viewer"] },
  { path: "/dashboard/brand/applications", roles: ["brand_owner", "brand_admin", "brand_member", "brand_viewer"] },
  { path: "/dashboard/brand/collaborations", roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
  { path: "/dashboard/brand/conversations", roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
  { path: "/dashboard/brand/invoices", roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
  { path: "/dashboard/brand/transactions", roles: ["brand_owner", "brand_admin", "brand_finance"] },
  { path: "/dashboard/brand/analytics", roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
  { path: "/dashboard/brand/settings", roles: ["brand_owner", "brand_admin"] },
  { path: "/dashboard/brand/team", roles: ["brand_owner", "brand_admin"] },
];

export const CREATOR_ROUTES: RouteConfig[] = [
  { path: "/dashboard/creator", roles: ["creator"] },
  { path: "/dashboard/creator/overview", roles: ["creator"] },
  { path: "/dashboard/creator/profile", roles: ["creator"] },
  { path: "/dashboard/creator/profile/edit", roles: ["creator"] },
  { path: "/dashboard/creator/social", roles: ["creator"] },
  { path: "/dashboard/creator/portfolio", roles: ["creator"] },
  { path: "/dashboard/creator/portfolio/new", roles: ["creator"] },
  { path: "/dashboard/creator/campaigns", roles: ["creator"] },
  { path: "/dashboard/creator/campaigns/:id", roles: ["creator"] },
  { path: "/dashboard/creator/applications", roles: ["creator"] },
  { path: "/dashboard/creator/collaborations", roles: ["creator"] },
  { path: "/dashboard/creator/collaborations/:id", roles: ["creator"] },
  { path: "/dashboard/creator/conversations", roles: ["creator"] },
  { path: "/dashboard/creator/earnings", roles: ["creator"] },
  { path: "/dashboard/creator/payouts", roles: ["creator"] },
  { path: "/dashboard/creator/settings", roles: ["creator"] },
];

export const ADMIN_ROUTES: RouteConfig[] = [
  { path: "/dashboard/admin", roles: ["platform_admin", "staff"] },
  { path: "/dashboard/admin/users", roles: ["platform_admin", "staff"], permissions: [PERMISSIONS.admin.users] },
  { path: "/dashboard/admin/brands", roles: ["platform_admin", "staff"], permissions: [PERMISSIONS.admin.brands] },
  { path: "/dashboard/admin/creators", roles: ["platform_admin", "staff"], permissions: [PERMISSIONS.admin.creators] },
  { path: "/dashboard/admin/campaigns", roles: ["platform_admin", "staff"], permissions: [PERMISSIONS.admin.campaigns] },
  { path: "/dashboard/admin/payments", roles: ["platform_admin", "staff"], permissions: [PERMISSIONS.admin.payments] },
  { path: "/dashboard/admin/analytics", roles: ["platform_admin", "staff"], permissions: [PERMISSIONS.admin.analytics] },
  { path: "/dashboard/admin/settings", roles: ["platform_admin"], permissions: [PERMISSIONS.admin.settings] },
  { path: "/dashboard/admin/moderation", roles: ["platform_admin", "moderator", "staff"], permissions: [PERMISSIONS.admin.moderation] },
  { path: "/dashboard/admin/disputes", roles: ["platform_admin", "moderator", "staff"], permissions: [PERMISSIONS.admin.moderation] },
  { path: "/dashboard/admin/support-tickets", roles: ["platform_admin", "moderator", "staff"], permissions: [PERMISSIONS.admin.moderation] },
  { path: "/dashboard/admin/moderation-reports", roles: ["platform_admin", "moderator", "staff"], permissions: [PERMISSIONS.admin.moderation] },
  { path: "/dashboard/admin/announcements", roles: ["platform_admin", "staff"], permissions: [PERMISSIONS.admin.settings] },
  { path: "/dashboard/admin/activity-logs", roles: ["platform_admin", "staff"], permissions: [PERMISSIONS.admin.users] },
];

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
  return permissions.some(p => hasPermission(userRole, p));
}

export function hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
  return permissions.every(p => hasPermission(userRole, p));
}

export function canAccessRoute(userRole: UserRole, path: string): boolean {
  const allRoutes = [...BRAND_ROUTES, ...CREATOR_ROUTES, ...ADMIN_ROUTES];
  const route = allRoutes.find(r => matchPath(r.path, path));
  if (!route) return true; // Allow unknown routes
  if (!route.roles.includes(userRole)) return false;
  if (route.permissions && !hasAllPermissions(userRole, route.permissions)) return false;
  return true;
}

function matchPath(pattern: string, path: string): boolean {
  const regexPattern = pattern
    .replace(/:[^/]+/g, "[^/]+")
    .replace(/\*/g, ".*");
  return new RegExp(`^${regexPattern}$`).test(path);
}

export function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case "brand_owner":
    case "brand_admin":
    case "brand_member":
    case "brand_finance":
    case "brand_viewer":
      return "/dashboard/brand";
    case "creator":
      return "/dashboard/creator";
    case "platform_admin":
    case "moderator":
    case "staff":
      return "/dashboard/admin";
    default:
      return "/dashboard";
  }
}

export function getRedirectPath(role: UserRole): string {
  return getDashboardRoute(role);
}

// ---------------------------------------------------------------------------
// Permission Groups for UI
// ---------------------------------------------------------------------------

export const PERMISSION_GROUPS = {
  campaigns: [
    PERMISSIONS.campaigns.create,
    PERMISSIONS.campaigns.read,
    PERMISSIONS.campaigns.update,
    PERMISSIONS.campaigns.delete,
    PERMISSIONS.campaigns.publish,
    PERMISSIONS.campaigns.manage_deliverables,
    PERMISSIONS.campaigns.manage_budget,
    PERMISSIONS.campaigns.view_analytics,
  ],
  creators: [
    PERMISSIONS.creators.read,
    PERMISSIONS.creators.invite,
    PERMISSIONS.creators.manage,
    PERMISSIONS.creators.view_rates,
    PERMISSIONS.creators.view_analytics,
  ],
  applications: [
    PERMISSIONS.applications.read,
    PERMISSIONS.applications.create,
    PERMISSIONS.applications.update,
    PERMISSIONS.applications.delete,
    PERMISSIONS.applications.manage,
  ],
  collaborations: [
    PERMISSIONS.collaborations.read,
    PERMISSIONS.collaborations.create,
    PERMISSIONS.collaborations.update,
    PERMISSIONS.collaborations.delete,
    PERMISSIONS.collaborations.manage,
    PERMISSIONS.collaborations.manage_deliverables,
    PERMISSIONS.collaborations.approve_deliverables,
  ],
  messages: [
    PERMISSIONS.messages.read,
    PERMISSIONS.messages.send,
    PERMISSIONS.messages.delete,
    PERMISSIONS.messages.manage_conversations,
  ],
  invoices: [
    PERMISSIONS.invoices.read,
    PERMISSIONS.invoices.create,
    PERMISSIONS.invoices.update,
    PERMISSIONS.invoices.delete,
    PERMISSIONS.invoices.send,
    PERMISSIONS.invoices.mark_paid,
  ],
  payments: [
    PERMISSIONS.payments.read,
    PERMISSIONS.payments.create,
    PERMISSIONS.payments.refund,
    PERMISSIONS.payments.view_history,
  ],
  analytics: [
    PERMISSIONS.analytics.read,
    PERMISSIONS.analytics.export,
    PERMISSIONS.analytics.view_revenue,
    PERMISSIONS.analytics.view_engagement,
  ],
  brand: [
    PERMISSIONS.brand.read,
    PERMISSIONS.brand.update,
    PERMISSIONS.brand.manage_members,
    PERMISSIONS.brand.manage_billing,
    PERMISSIONS.brand.manage_verification,
    PERMISSIONS.brand.delete,
  ],
  profile: [
    PERMISSIONS.profile.read,
    PERMISSIONS.profile.update,
    PERMISSIONS.profile.manage_social,
    PERMISSIONS.profile.manage_portfolio,
    PERMISSIONS.profile.manage_rates,
    PERMISSIONS.profile.manage_availability,
  ],
} as const;

export function getMissingPermissions(userRole: UserRole, requiredPermissions: string[]): string[] {
  return requiredPermissions.filter(p => !hasPermission(userRole, p));
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isBrandRole(role: UserRole): boolean {
  return role.startsWith("brand_");
}

export function isCreatorRole(role: UserRole): boolean {
  return role === "creator";
}

export function isAdminRole(role: UserRole): boolean {
  return ["platform_admin", "moderator", "staff"].includes(role);
}

export function isPrivilegedRole(role: UserRole): boolean {
  return ["platform_admin", "brand_owner", "brand_admin"].includes(role);
}

