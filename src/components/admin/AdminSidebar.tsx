"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  Settings,
  Shield,
  Download,
  Mail,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  userName?: string;
  userRole?: string;
}

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & key metrics",
  },
  {
    href: "/admin/campaigns",
    label: "Campaigns",
    icon: FileText,
    description: "Manage all customer campaigns",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
    description: "Data analyst reports & exports",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    description: "Security & configuration",
  },
];

export function AdminSidebar({
  isCollapsed,
  onToggle,
  userName,
  userRole,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border-subtle bg-surface dark:bg-surface dark:border-neutral-800 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <span className="text-xs font-bold">C</span>
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-tight">
              CALLBACX
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 shadow-sm shadow-brand/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn(isCollapsed ? "hidden" : "block")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 space-y-2 border-t border-border-subtle">
        {!isCollapsed && (
          <div className="px-2 space-y-1">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/30">
              <Shield className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="text-xs text-text-tertiary medium">Secure admin</span>
            </div>
            <p className="text-[10px] text-text-tertiary px-2 leading-relaxed">
              Email-managed campaigns only. No public dashboards.
            </p>
          </div>
        )}
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className={cn(isCollapsed ? "hidden" : "block")}>Settings</span>
        </Link>
        <button
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/10 transition-colors"
          onClick={() => {
            // Sign out — in a real app this would clear session cookies
            window.location.href = "/contact";
          }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(isCollapsed ? "hidden" : "block")}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
