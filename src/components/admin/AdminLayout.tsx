"use client";

import * as React from "react";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Public header (minimal on admin pages) */}
      <div className="hidden lg:block">
        <SiteHeader />
      </div>

      <div className="flex flex-1">
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((prev) => !prev)}
          userName="Admin User"
          userRole="Administrator"
        />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            isCollapsed={isCollapsed}
            onToggleSidebar={() => setIsCollapsed((prev) => !prev)}
          />
          <main className="flex-1 overflow-y-auto bg-neutral-50/30 dark:bg-neutral-950/30 p-4 lg:p-6">
            <div className="mx-auto max-w-[120rem] px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
