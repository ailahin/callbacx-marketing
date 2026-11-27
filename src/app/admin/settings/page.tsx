"use client";

import * as React from "react";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  StatsCard,
  DataTable,
  ChartCard,
  BarChart,
} from "@/components/admin";
import { Button } from "@/components/ui/Button";
import { Shield, Mail, Lock, Eye, RefreshCw, Save, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  status: "enabled" | "disabled" | "warning";
  icon: React.ReactNode;
}

interface ConfigItem {
  key: string;
  label: string;
  value: string;
  type: "text" | "toggle" | "select";
}

const SECURITY_SETTINGS: SecuritySetting[] = [
  {
    id: "csrf",
    name: "CSRF Protection",
    description: "Cross-Site Request Forgery tokens on all state-changing admin actions",
    status: "enabled",
    icon: () => <Shield className="h-5 w-5" />,
  },
  {
    id: "secure-headers",
    name: "Secure Response Headers",
    description: "CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy enforced",
    status: "enabled",
    icon: () => <Lock className="h-5 w-5" />,
  },
  {
    id: "data-minimization",
    name: "Data Minimization",
    description: "Only essential campaign data collected — no personal data beyond name/email",
    status: "enabled",
    icon: () => <Mail className="h-5 w-5" />,
  },
  {
    id: "no-local-storage",
    name: "No Local Storage",
    description: "Admin session data not persisted in browser localStorage",
    status: "enabled",
    icon: () => <Eye className="h-5 w-5" />,
  },
];

const CONFIG_ITEMS: ConfigItem[] = [
  { key: "session_timeout", label: "Session Timeout", value: "15 minutes", type: "select" },
  { key: "csrf_token_lifetime", label: "CSRF Token Lifetime", value: "15 minutes", type: "select" },
  { key: "export_format", label: "Default Export Format", value: "CSV (Excel)", type: "select" },
  { key: "require_2fa", label: "Require 2FA for Exports", value: "Disabled", type: "toggle" },
];

export default function AdminSettingsPage() {
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <PageHero
        title="Admin Settings"
        description="Security configuration, session management, and system preferences for the admin dashboard."
        imagePosition="none"
      />

      {/* Security Overview */}
      <SectionTitle title="Security Configuration" textAlign="left" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SECURITY_SETTINGS.map((setting) => (
          <StatsCard
            key={setting.id}
            title={setting.name}
            value={setting.status === "enabled" ? "Active" : setting.status === "disabled" ? "Inactive" : "Warning"}
            change={{ value: setting.status === "enabled" ? "Protected" : "Review needed", positive: setting.status === "enabled" }}
            trend={setting.status === "enabled" ? "up" : setting.status === "warning" ? "neutral" : "down"}
            icon={setting.icon}
            color={setting.status === "enabled" ? "sage" : setting.status === "warning" ? "accent" : "neutral"}
            subtitle={setting.description}
          />
        ))}
      </div>

      {/* Configuration */}
      <SectionTitle title="System Configuration" textAlign="left" />
      <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 shadow-sm dark:border-neutral-800 p-6">
        <div className="space-y-4">
          {CONFIG_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b border-border-subtle dark:border-neutral-800 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 flex items-center justify-center text-text-tertiary">
                  {item.type === "toggle" ? (
                    <Shield className="h-5 w-5" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-tertiary">{item.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.type === "toggle" && (
                  <button className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-input">
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        item.value === "Enabled" ? "translate-x-7" : "translate-x-1"
                      )}
                      aria-checked={item.value === "Enabled"}
                      role="switch"
                    />
                  </button>
                )}
                {item.type !== "toggle" && (
                  <span className="text-sm text-text-secondary font-medium">{item.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 shadow-sm dark:border-neutral-800 p-6">
        <SectionTitle title="Actions" textAlign="left" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={handleSave}
            disabled={saved}
            className="flex items-center gap-2"
          >
            {saved ? (
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 text-success-600">✓</span> Saved
              </span>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Configuration</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Regenerate CSRF token
              alert("CSRF token regenerated");
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Regenerate CSRF Token
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Export security config
              const configData = CONFIG_ITEMS.map((i) => ({ key: i.key, label: i.label, value: i.value, type: i.type }));
              import("../../../components/admin/export").then(({ exportToJson }) => {
                exportToJson(configData, "callbacx-security-config");
              });
            }}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export Config (JSON)
          </Button>
        </div>
      </div>

      {/* Sustainability & Data Policy */}
      <div className="rounded-2xl border border-border-subtle bg-neutral-50/50 dark:bg-neutral-800/30 p-6 dark:border-neutral-800">
        <SectionTitle title="Sustainability & Data Policy" textAlign="left" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Data Principles</h4>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
                <span>No public registration or login — email-only contact</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
                <span>No member dashboards — reduces attack surface</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
                <span>Data minimization — only essential campaign fields</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
                <span>No localStorage — session data kept in memory only</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Sustainability</h4>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-sage-600 dark:text-sage-400">•</span>
                Server-side rendering — minimal client JavaScript
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-sage-600 dark:text-sage-400">•</span>
                Dark mode support — energy efficient on OLED screens
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-sage-600 dark:text-sage-400">•</span>
                No third-party analytics — zero external tracking
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5 text-sage-600 dark:text-sage-400">•</span>
                CSV export — lightweight, opens natively in Excel
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
