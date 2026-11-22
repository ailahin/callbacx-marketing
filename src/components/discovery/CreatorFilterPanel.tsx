"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  Button,
  Tag,
  TagGroup,
  Input,
  Select,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  Badge,
} from "@/components";
import type { ListCreatorsInput } from "@/lib/validations";
import { AUDIENCE_SIZE_BOUNDS } from "@/lib/validations";

export interface DiscoveryFilters extends Omit<ListCreatorsInput, "limit" | "offset"> {
  limit?: number;
  offset?: number;
}

export interface CreatorFilterPanelProps {
  filters: DiscoveryFilters;
  categories: Array<{ id: string; name: string; slug: string }>;
  niches: Array<{ id: string; name: string; slug: string; category_id: string }>;
  onChange: (filters: DiscoveryFilters) => void;
  count?: number;
  className?: string;
  sheetSide?: "left" | "right";
}

function SearchIconLocal({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function FilterIconLocal({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
    </svg>
  );
}

const PLATFORMS = ["instagram", "tiktok", "youtube", "facebook", "x", "linkedin"];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
];
const AVAILABILITY = [
  { value: "open", label: "Open to collaborations" },
  { value: "busy", label: "Busy" },
  { value: "unavailable", label: "Unavailable" },
];
const VERIFICATION = [
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const AUDIENCE_SIZE_LABELS: Record<string, string> = {
  nano: "Nano (1K–10K)",
  micro: "Micro (10K–100K)",
  mid: "Mid (100K–500K)",
  macro: "Macro (500K–1M)",
  mega: "Mega (1M+)",
};

export function CreatorFilterPanel({
  filters,
  categories,
  niches,
  onChange,
  count,
  className,
  sheetSide = "right",
}: CreatorFilterPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [local, setLocal] = React.useState<DiscoveryFilters>(filters);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(
    local.categoryId ?? null
  );

  const filteredNichs = niches.filter(
    (n) => !activeCategory || n.category_id === activeCategory
  );

  const setFilter = (key: string, value: unknown) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = Object.entries(local).filter(
    ([key, value]) =>
      key !== "limit" &&
      key !== "offset" &&
      key !== "sortBy" &&
      key !== "sortOrder" &&
      value !== undefined &&
      value !== null &&
      value !== ""
  ).length;

  const reset = () => {
    setLocal({
      categoryId: undefined,
      nicheId: undefined,
      platform: undefined,
      audienceSize: undefined,
      minEngagementRate: undefined,
      maxEngagementRate: undefined,
      minFollowers: undefined,
      maxFollowers: undefined,
      language: undefined,
      location: undefined,
      availability: undefined,
      verificationStatus: undefined,
      minRate: undefined,
      maxRate: undefined,
      search: undefined,
      sortBy: "created_at",
      sortOrder: "desc",
    });
    setActiveCategory(null);
  };

  const apply = () => {
    onChange(local);
    setOpen(false);
  };

  return (
    <div className={className}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-sm"
          onClick={() => setOpen(true)}
          aria-label="Open filters"
        >
          <FilterIconLocal className="h-4 w-4" />
          {activeFilterCount > 0 ? (
            <Badge variant="secondary" size="xs">{activeFilterCount}</Badge>
          ) : null}
          Filters
        </Button>
        <Sheet open={open} onOpenChange={setOpen} side={sheetSide}>
          <SheetTrigger />
          <SheetContent className="max-w-[480px]">
          <SheetHeader className="pb-4">
            <SheetTitle>Filter creators</SheetTitle>
            <SheetDescription>
              Refine discovery results by niche, platform, audience, rates and
              availability.
            </SheetDescription>
            <SheetClose onClick={() => setOpen(false)} />
          </SheetHeader>
          <CardContent className="space-y-6 p-4">
            <div className="flex items-center gap-2 mb-1">
              <SearchIconLocal className="h-4 w-4 text-text-secondary" />
              <Input
                value={local.search ?? ""}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search creators by name or bio"
                className="flex-1"
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Category &amp; niche
              </h3>
              <TagGroup
                tags={categories.map((c) => ({ value: c.id, label: c.name }))}
                selected={local.categoryId ? [local.categoryId] : []}
                onChange={(selected) => {
                  setFilter("categoryId", selected[0] ?? undefined);
                  setFilter("nicheId", undefined);
                  setActiveCategory(selected[0] ?? null);
                }}
                multiple={false}
                variant="primary"
              />
              {filteredNichs.length > 0 && (
                <div className="mt-3">
                  <TagGroup
                    tags={filteredNichs.map((n) => ({ value: n.id, label: n.name }))}
                    selected={local.nicheId ? [local.nicheId] : []}
                    onChange={(selected) =>
                      setFilter("nicheId", selected[0] ?? undefined)
                    }
                    multiple={false}
                    variant="secondary"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Platform &amp; audience
              </h3>
              <TagGroup
                tags={PLATFORMS.map((p) => ({
                  value: p,
                  label: p.charAt(0).toUpperCase() + p.slice(1),
                }))}
                selected={local.platform ? [local.platform] : []}
                onChange={(selected) =>
                  setFilter("platform", selected[0] ?? undefined)
                }
                multiple={false}
                variant="default"
              />
              <div className="grid gap-2">
                {Object.entries(AUDIENCE_SIZE_BOUNDS).map(([key]) => (
                  <Tag key={key} selected={local.audienceSize === key} onSelect={(sel: boolean) =>
                    setFilter("audienceSize", sel ? key : undefined)
                  } size="sm">
                    {AUDIENCE_SIZE_LABELS[key]}
                  </Tag>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">
                  Min engagement rate (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={local.minEngagementRate ?? ""}
                  onChange={(e) =>
                    setFilter(
                      "minEngagementRate",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">
                  Max engagement rate (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={local.maxEngagementRate ?? ""}
                  onChange={(e) =>
                    setFilter(
                      "maxEngagementRate",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">
                  Min followers
                </label>
                <Input
                  type="number"
                  min="0"
                  value={local.minFollowers ?? ""}
                  onChange={(e) =>
                    setFilter(
                      "minFollowers",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="1,000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">
                  Max followers
                </label>
                <Input
                  type="number"
                  min="0"
                  value={local.maxFollowers ?? ""}
                  onChange={(e) =>
                    setFilter(
                      "maxFollowers",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="1,000,000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">
                Language
              </label>
              <Select
                value={local.language ?? ""}
                onChange={(e) => setFilter("language", e.target.value || undefined)}
                placeholder="All languages"
                options={LANGUAGES.map(({ value, label }) => ({ value, label }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">
                Location (city / region / country)
              </label>
              <Input
                value={local.location ?? ""}
                onChange={(e) => setFilter("location", e.target.value || undefined)}
                placeholder="e.g. Austin, TX"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-text-secondary">
                  Availability
                </label>
                <TagGroup
                  tags={AVAILABILITY}
                  selected={local.availability ? [local.availability] : []}
                  onChange={(selected) =>
                    setFilter("availability", selected[0] ?? undefined)
                  }
                  multiple={false}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">
                  Verification
                </label>
                <TagGroup
                  tags={VERIFICATION}
                  selected={local.verificationStatus ? [local.verificationStatus] : []}
                  onChange={(selected) =>
                    setFilter("verificationStatus", selected[0] ?? undefined)
                  }
                  multiple={false}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">
                  Min rate (USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={local.minRate ?? ""}
                  onChange={(e) =>
                    setFilter(
                      "minRate",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">
                  Max rate (USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={local.maxRate ?? ""}
                  onChange={(e) =>
                    setFilter(
                      "maxRate",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="10,000"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t border-border-subtle flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={reset} className="flex-1">
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={apply} className="flex-1">
              {count !== undefined ? `Show ${count}` : "Show results"}
            </Button>
          </CardFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
