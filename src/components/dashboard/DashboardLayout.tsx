"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/layout/MobileNavigation";
import { useAuth } from "@/context/AuthProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  roles?: string[];
  permissions?: string[];
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface SidebarProps {
  sections: NavSection[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  } | null;
  className?: string;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const icons = {
  overview: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  campaigns: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  creators: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  applications: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  collaborations: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  conversations: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h4M8 12l2-2m0 0l2 2m-2-2v8m-6 0h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  invoices: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  transactions: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" />
    </svg>
  ),
  analytics: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  settings: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  team: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1zm18 0a6 6 0 01-12 0v1h12v-1z" />
    </svg>
  ),
  profile: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  social: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  portfolio: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  earnings: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" />
    </svg>
  ),
  payouts: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  admin: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  users: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  brands: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  moderation: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chevronRight: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  chevronDown: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  menu: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  logo: (
    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  notification: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Brand Navigation Config
// ---------------------------------------------------------------------------

export const BRAND_NAV_SECTIONS: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Overview", href: "/dashboard/brand", icon: icons.overview, roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
    ],
  },
  {
    title: "Campaigns",
    items: [
      { label: "All Campaigns", href: "/dashboard/brand/campaigns", icon: icons.campaigns, roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
      { label: "Create Campaign", href: "/dashboard/brand/campaigns/new", icon: icons.campaigns, roles: ["brand_owner", "brand_admin", "brand_member"] },
    ],
  },
  {
    title: "Creators",
    items: [
      { label: "Discover Creators", href: "/dashboard/brand/creators", icon: icons.creators, roles: ["brand_owner", "brand_admin", "brand_member", "brand_viewer"] },
      { label: "Invitations", href: "/dashboard/brand/invitations", icon: icons.creators, roles: ["brand_owner", "brand_admin", "brand_member"], badge: 3 },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Applications", href: "/dashboard/brand/applications", icon: icons.applications, roles: ["brand_owner", "brand_admin", "brand_member", "brand_viewer"], badge: 5 },
      { label: "Active Collaborations", href: "/dashboard/brand/collaborations", icon: icons.collaborations, roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
      { label: "Conversations", href: "/dashboard/brand/conversations", icon: icons.conversations, roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"], badge: 2 },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices", href: "/dashboard/brand/invoices", icon: icons.invoices, roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
      { label: "Transactions", href: "/dashboard/brand/transactions", icon: icons.transactions, roles: ["brand_owner", "brand_admin", "brand_finance"] },
      { label: "Analytics", href: "/dashboard/brand/analytics", icon: icons.analytics, roles: ["brand_owner", "brand_admin", "brand_member", "brand_finance", "brand_viewer"] },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Company Profile", href: "/dashboard/brand/settings", icon: icons.settings, roles: ["brand_owner", "brand_admin"] },
      { label: "Team Members", href: "/dashboard/brand/team", icon: icons.team, roles: ["brand_owner", "brand_admin"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Creator Navigation Config
// ---------------------------------------------------------------------------

export const CREATOR_NAV_SECTIONS: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Overview", href: "/dashboard/creator", icon: icons.overview },
    ],
  },
  {
    title: "Profile",
    items: [
      { label: "My Profile", href: "/dashboard/creator/profile", icon: icons.profile },
      { label: "Social Accounts", href: "/dashboard/creator/social", icon: icons.social },
      { label: "Portfolio", href: "/dashboard/creator/portfolio", icon: icons.portfolio },
    ],
  },
  {
    title: "Campaigns",
    items: [
      { label: "Browse Campaigns", href: "/dashboard/creator/campaigns", icon: icons.campaigns },
      { label: "My Applications", href: "/dashboard/creator/applications", icon: icons.applications, badge: 3 },
    ],
  },
  {
    title: "Partnerships",
    items: [
      { label: "Active Collaborations", href: "/dashboard/creator/collaborations", icon: icons.collaborations },
      { label: "Conversations", href: "/dashboard/creator/conversations", icon: icons.conversations, badge: 1 },
    ],
  },
  {
    title: "Earnings",
    items: [
      { label: "Earnings Overview", href: "/dashboard/creator/earnings", icon: icons.earnings },
      { label: "Payouts", href: "/dashboard/creator/payouts", icon: icons.payouts },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Account Settings", href: "/dashboard/creator/settings", icon: icons.settings },
    ],
  },
];

// ---------------------------------------------------------------------------
// Admin Navigation Config
// ---------------------------------------------------------------------------

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard/admin", icon: icons.overview },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Users", href: "/dashboard/admin/users", icon: icons.users, permissions: ["admin:users"] },
      { label: "Brands", href: "/dashboard/admin/brands", icon: icons.brands, permissions: ["admin:brands"] },
      { label: "Creators", href: "/dashboard/admin/creators", icon: icons.creators, permissions: ["admin:creators"] },
      { label: "Campaigns", href: "/dashboard/admin/campaigns", icon: icons.campaigns, permissions: ["admin:campaigns"] },
    ],
  },
  {
    title: "Moderation",
    items: [
      { label: "Disputes", href: "/dashboard/admin/disputes", icon: icons.moderation, permissions: ["admin:moderation"] },
      { label: "Support Tickets", href: "/dashboard/admin/support-tickets", icon: icons.conversations, permissions: ["admin:moderation"] },
      { label: "Reports", href: "/dashboard/admin/moderation-reports", icon: icons.analytics, permissions: ["admin:moderation"] },
      { label: "Activity Logs", href: "/dashboard/admin/activity-logs", icon: icons.admin, permissions: ["admin:users"] },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", href: "/dashboard/admin/payments", icon: icons.transactions, permissions: ["admin:payments"] },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Platform Analytics", href: "/dashboard/admin/analytics", icon: icons.analytics, permissions: ["admin:analytics"] },
    ],
  },
  {
    title: "Communications",
    items: [
      { label: "Announcements", href: "/dashboard/admin/announcements", icon: icons.notification, permissions: ["admin:settings"] },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Platform Settings", href: "/dashboard/admin/settings", icon: icons.settings, permissions: ["admin:settings"] },
      { label: "Integrations", href: "/dashboard/admin/integrations", icon: icons.social, permissions: ["admin:settings"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------

export function Sidebar({ sections, user, className, collapsed = false, onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const { hasRole, hasPermission } = useAuth();

  const filterItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (item.roles && !hasRole(item.roles as any)) return false;
      if (item.permissions) {
        if (!item.permissions.every((p: string) => hasPermission(p))) return false;
      }
      if (item.children) {
        const filteredChildren = filterItems(item.children);
        return filteredChildren.length > 0;
      }
      return true;
    }).map(item => ({
      ...item,
      children: item.children ? filterItems(item.children) : undefined,
    }));
  };

  const filteredSections = sections
    .map(section => ({
      ...section,
      items: filterItems(section.items),
    }))
    .filter(section => section.items.length > 0);

  const isActive = (href: string) => {
    if (href === "/dashboard/brand" || href === "/dashboard/creator" || href === "/dashboard/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-surface border-r border-border-subtle transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
        className
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn("flex items-center justify-between h-16 px-4 border-b border-border-subtle", collapsed && "justify-center")}>
<Link href="/" className="flex items-center gap-3" aria-label="CALLBACX MARKETING Home">
          <span className={cn("text-brand-600 dark:text-brand-400", collapsed && "hidden")}>
            <span className="text-xl font-bold">CALLBACX MARKETING</span>
          </span>
          {collapsed && <span className="text-brand-600 dark:text-brand-400 text-xl font-bold">C</span>}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={() => onCollapseChange?.(!collapsed)}
            className="ml-auto p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Collapse sidebar"
            aria-expanded={!collapsed}
          >
            {icons.chevronRight}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="Dashboard navigation">
        {filteredSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-1">
            {!collapsed && section.title && (
              <h3 className="px-3 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <ul className="space-y-0.5" role="list">
              {section.items.map((item, itemIndex) => (
                <NavItemComponent
                  key={itemIndex}
                  item={item}
                  isActive={isActive(item.href)}
                  collapsed={collapsed}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-3 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-tertiary truncate">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 rounded-full capitalize">
                {user.role.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// NavItem Component
// ---------------------------------------------------------------------------

function NavItemComponent({ item, isActive, collapsed }: { item: NavItem; isActive: boolean; collapsed: boolean }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            isActive || expanded
              ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50"
              : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
          )}
          aria-expanded={expanded}
        >
          <span className="flex items-center gap-3 flex-1">
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </span>
          {!collapsed && (
            <span className={cn("flex-shrink-0 text-text-tertiary transition-transform", expanded && "rotate-180")}>
              {icons.chevronDown}
            </span>
          )}
          {!collapsed && item.badge && (
            <Badge size="xs" variant="primary">{item.badge}</Badge>
          )}
        </button>
        {!collapsed && expanded && (
          <ul className="mt-1 ml-8 border-l-2 border-border-subtle space-y-1 animate-slide-in-top" role="list">
            {item.children?.map((child, childIndex) => (
              <li key={childIndex}>
                <Link
                  href={child.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    isActive
                      ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50"
                      : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  <span className="flex-shrink-0">{child.icon}</span>
                  <span className="truncate">{child.label}</span>
                  {child.badge && <Badge size="xs" variant="primary">{child.badge}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          isActive
            ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50"
            : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge && <Badge size="xs" variant="primary">{item.badge}</Badge>}
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Mobile Sidebar Sheet
// ---------------------------------------------------------------------------

export function MobileSidebar({ sections, user, isOpen, onClose }: { sections: NavSection[]; user: SidebarProps["user"]; isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { hasRole, hasPermission } = useAuth();

  const filterItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (item.roles && !hasRole(item.roles as any)) return false;
      if (item.permissions) {
        if (!item.permissions.every((p: string) => hasPermission(p))) return false;
      }
      if (item.children) {
        const filteredChildren = filterItems(item.children);
        return filteredChildren.length > 0;
      }
      return true;
    }).map(item => ({
      ...item,
      children: item.children ? filterItems(item.children) : undefined,
    }));
  };

  const filteredSections = sections
    .map(section => ({
      ...section,
      items: filterItems(section.items),
    }))
    .filter(section => section.items.length > 0);

  const isActive = (href: string) => {
    if (href === "/dashboard/brand" || href === "/dashboard/creator" || href === "/dashboard/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="h-full flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Navigation</SheetTitle>
            <SheetClose onClick={onClose} />
          </div>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6" aria-label="Mobile navigation">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              {section.title && (
                <h3 className="px-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1" role="list">
                {section.items.map((item, itemIndex) => (
                  <MobileNavItem key={itemIndex} item={item} isActive={isActive(item.href)} onClose={onClose} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {user && (
          <div className="p-4 border-t border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 rounded-full capitalize">
                  {user.role.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MobileNavItem({ item, isActive, onClose }: { item: NavItem; isActive: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (!hasChildren) onClose();
  };

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-3 rounded-lg text-base font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            isActive || expanded
              ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50"
              : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
          )}
          aria-expanded={expanded}
        >
          <span className="flex items-center gap-3 flex-1">
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </span>
          <span className={cn("flex-shrink-0 text-text-tertiary transition-transform", expanded && "rotate-180")}>
            {icons.chevronDown}
          </span>
          {item.badge && <Badge size="sm" variant="primary">{item.badge}</Badge>}
        </button>
        {expanded && (
          <ul className="mt-1 ml-6 border-l-2 border-border-subtle space-y-1 animate-slide-in-top" role="list">
            {item.children?.map((child, childIndex) => (
              <li key={childIndex}>
                <Link
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    isActive
                      ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50"
                      : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  <span className="flex-shrink-0">{child.icon}</span>
                  <span className="truncate">{child.label}</span>
                  {child.badge && <Badge size="sm" variant="primary">{child.badge}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-base font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          isActive
            ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/50"
            : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        <span className="truncate">{item.label}</span>
        {item.badge && <Badge size="sm" variant="primary">{item.badge}</Badge>}
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Top Bar Component
// ---------------------------------------------------------------------------

export interface TopBarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
  user?: SidebarProps["user"];
  onProfileClick?: () => void;
  onSignOut?: () => void;
}

export function TopBar({ title, description, actions, onMenuClick, showMobileMenu = true, user, onProfileClick, onSignOut }: TopBarProps) {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border-subtle">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          {showMobileMenu && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Open navigation menu"
            >
              {icons.menu}
            </button>
          )}

          {/* Page Title */}
          <div className="flex-1 min-w-0 lg:hidden">
            <h1 className="text-lg font-semibold text-text-primary truncate">{title}</h1>
            {description && <p className="text-sm text-text-secondary truncate">{description}</p>}
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block flex-1">
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
            {description && <p className="text-sm text-text-secondary">{description}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}

            {/* Notifications */}
            <button
              type="button"
              className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Notifications"
            >
              {icons.notification}
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-error-500 text-white text-[10px] font-mono flex items-center justify-center">3</span>
            </button>

            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={onProfileClick}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="User menu"
                  aria-expanded="false"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium text-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-text-primary">{user.name}</span>
                  <span className="h-4 w-4 text-text-tertiary hidden sm:block">
                    {icons.chevronDown}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Layout Wrapper
// ---------------------------------------------------------------------------

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navSections: NavSection[];
  title: string;
  description?: string;
  topBarActions?: React.ReactNode;
  user?: SidebarProps["user"];
  onProfileClick?: () => void;
  onSignOut?: () => void;
}

export function DashboardLayout({ children, navSections, title, description, topBarActions, user, onProfileClick, onSignOut }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        sections={navSections}
        user={user}
        collapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar
        sections={navSections}
        user={user}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Top Bar */}
        <TopBar
          title={title}
          description={description}
          actions={topBarActions}
          onMenuClick={() => setMobileSidebarOpen(true)}
          showMobileMenu={true}
          user={user}
          onProfileClick={onProfileClick}
          onSignOut={onSignOut}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

