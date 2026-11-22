"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  StatusBadge,
  Button,
} from "@/components";
import { MapPinIcon, UsersIcon, EyeIcon, LinkIcon, ClockIcon } from "@/components/ui/icons";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { CreatorListItem } from "@/services/creators";

export interface CreatorComparisonProps {
  creators: CreatorListItem[];
  onRemove?: (creatorId: string) => void;
  className?: string;
}

function availabilityLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "busy":
      return "Busy";
    case "unavailable":
      return "Unavailable";
    default:
      return "Not specified";
  }
}

function rateLabel(creator: CreatorListItem): string {
  if (creator.min_rate === null) return "Not disclosed";
  return formatCurrency(
    creator.min_rate,
    creator.rates[0]?.currency ?? "USD"
  );
}

export function CreatorComparison({
  creators,
  onRemove,
  className,
}: CreatorComparisonProps) {
  if (creators.length === 0) {
    return (
      <Card variant="outlined" padding="lg" className={cn(className)}>
        <CardContent className="text-center py-10">
          <p className="text-text-secondary">No creators selected for comparison.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("overflow-x-auto border border-border-subtle rounded-2xl bg-surface dark:border-neutral-800", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-subtle dark:bg-neutral-800/50">
            <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Attribute
            </th>
            {creators.map((creator) => (
              <th
                key={creator.id}
                className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRemove?.(creator.id)}
                    aria-label={`Remove ${creator.display_name} from comparison`}
                    className="flex-shrink-0 opacity-40 hover:opacity-100 transition-colors"
                  >
                    ×
                  </button>
                  <div className="flex items-center gap-2">
                    <img
                      src={creator.avatar_url ?? ""}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover bg-neutral-200 dark:bg-neutral-700"
                    />
                    <span className="font-medium text-text-primary truncate max-w-[120px]">
                      {creator.display_name}
                    </span>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle dark:divide-neutral-800">
          <tr className="group">
            <td className="p-4 text-sm text-text-secondary w-48">
              <span className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Categories / niches
              </span>
            </td>
            {creators.map((creator) => (
              <td key={creator.id} className="p-4 text-sm text-text-primary">
                <div className="flex flex-wrap gap-1.5">
                  {creator.categories.slice(0, 3).map((c) => (
                    <Badge key={c.id} variant="default" size="xs">
                      {c.name}
                    </Badge>
                  ))}
                  {creator.categories.length > 3 && (
                    <span className="text-xs text-text-tertiary">+{creator.categories.length - 3} more</span>
                  )}
                </div>
              </td>
            ))}
          </tr>
          <tr className="group">
            <td className="p-4 text-sm text-text-secondary w-48">
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                Location
              </span>
            </td>
            {creators.map((creator) => (
              <td key={creator.id} className="p-4 text-sm text-text-primary">
                {typeof creator.location === "object" && creator.location !== null &&
                [
                  (creator.location as Record<string, unknown>).city,
                  (creator.location as Record<string, unknown>).region,
                  (creator.location as Record<string, unknown>).country,
                ].some(Boolean)
                  ? [
                      (creator.location as Record<string, unknown>).city,
                      (creator.location as Record<string, unknown>).region,
                      (creator.location as Record<string, unknown>).country,
                    ]
                    .filter(Boolean)
                    .join(", ")
                  : "Not disclosed"}
              </td>
            ))}
          </tr>
          <tr className="group">
            <td className="p-4 text-sm text-text-secondary w-48">
              <span className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Audience (max platform)
              </span>
            </td>
            {creators.map((creator) => (
              <td key={creator.id} className="p-4 text-sm text-text-primary">
                {creator.total_followers !== null ? (
                  <>
                    {formatNumber(creator.total_followers)} followers
                    {creator.max_engagement_rate !== null && (
                      <>
                        <br />
                        <span className="text-xs text-text-secondary">
                          {creator.max_engagement_rate.toFixed(2)}% engagement
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  "Not disclosed"
                )}
              </td>
            ))}
          </tr>
          <tr className="group">
            <td className="p-4 text-sm text-text-secondary w-48">
              <span className="flex items-center gap-2">
                <EyeIcon className="h-4 w-4" />
                Rate
              </span>
            </td>
            {creators.map((creator) => (
              <td key={creator.id} className="p-4 text-sm text-text-primary">
                {rateLabel(creator)}
              </td>
            ))}
          </tr>
          <tr className="group">
            <td className="p-4 text-sm text-text-secondary w-48">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Availability
              </span>
            </td>
            {creators.map((creator) => (
              <td key={creator.id} className="p-4 text-sm text-text-primary">
                <StatusBadge
                  status={
                    creator.availability_status === "open"
                      ? "active"
                      : creator.availability_status === "busy"
                        ? "pending"
                        : "inactive"
                  }
                  size="sm"
                  showDot
                  label={availabilityLabel(creator.availability_status)}
                />
              </td>
            ))}
          </tr>
          <tr className="group">
            <td className="p-4 text-sm text-text-secondary w-48">
              <span className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Contact
              </span>
            </td>
            {creators.map((creator) => {
              const contactEmail = creator.contact_email;
              return (
                <td key={creator.id} className="p-4 text-sm">
                  {contactEmail ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigator.clipboard.writeText(contactEmail);
                      }}
                      className="text-brand-600 hover:underline text-sm"
                    >
                      {creator.contact_email}
                    </button>
                  ) : (
                    <span className="text-text-tertiary">Not disclosed</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
