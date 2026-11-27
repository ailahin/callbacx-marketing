"use client";

import * as React from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  User,
  Moon,
  Sun,
  Search,
  Menu,
  MoreVertical,
  Shield,
  Download,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  userName?: string;
  userRole?: string;
}

export function AdminHeader({
  isCollapsed,
  onToggleSidebar,
  userName = "Admin User",
  userRole = "Administrator",
}: AdminHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
    const root = window.document.documentElement;
    root.classList.toggle("dark");
  };

  const activeItem = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/campaigns", label: "Campaigns" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/settings", label: "Settings" },
  ].find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border-subtle bg-background/80 backdrop-blur-md dark:bg-surface/80 dark:border-neutral-800">
      <button
        onClick={onToggleSidebar}
        className="inline-flex items-center justify-center p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
        aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span className="text-xs font-medium text-text-primary tracking-tight">
              {activeItem?.label ?? "Admin"}
            </span>
          </div>
          <div className="h-4 w-px bg-border-subtle" />
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3.5 text-text-tertiary" />
            <input
              type="search"
              placeholder="Search campaigns…"
              className="pl-9 pr-3 h-8 rounded-full border border-border-subtle bg-surface dark:bg-neutral-800 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-transparent transition-colors placeholder:text-text-tertiary"
              maxLength="100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Dark mode (saves energy on OLED screens)" : "Light mode"}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-2 w-2 items-center justify-center">
              <span className="flex h-full w-full rounded-full bg-error-500 text-[10px] text-white font-bold leading-none">
                3
              </span>
            </span>
          </button>

          <div
            className="relative inline-block"
            onMouseEnter={() => setUserMenuOpen(true)}
            onMouseLeave={() => setUserMenuOpen(false)}
          >
            <button
              className="flex items-center gap-2 pl-2 pr-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="User profile"
            >
              <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-xs shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className={cn("hidden sm:block", userMenuOpen ? "block" : "hidden")}>
                <span className="text-xs font-medium text-text-primary block">{userName}</span>
                <span className="text-[10px] text-text-tertiary block">{userRole}</span>
              </div>
              <MoreVertical className="h-4 w-4" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border-subtle bg-background dark:bg-surface shadow-xl dark:border-neutral-800 py-2 z-50">
                <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <User className="h-4 w-4" /> Profile
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <Shield className="h-4 w-4" /> Security
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <Download className="h-4 w-4" /> Export Data
                </button>
                <hr className="my-1 border-border-subtle" />
                <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/10 transition-colors">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
