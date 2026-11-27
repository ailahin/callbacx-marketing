"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterChip {
  label: string;
  value: string;
  count?: number;
}

interface QuickFilterProps {
  filters: FilterChip[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  onClear: () => void;
}

export function QuickFilter({
  filters,
  activeFilter,
  onFilterChange,
  onClear,
}: QuickFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClear}
        disabled={activeFilter === "all"}
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
          activeFilter === "all"
            ? "bg-brand-600 text-white border-brand-600"
            : "border-border-subtle text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
        )}
      >
        All
      </button>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
            activeFilter === filter.value
              ? "bg-brand-600 text-white border-brand-600"
              : "border-border-subtle text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
          )}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-current/10 text-current">
              {filter.count}
            </span>
          )}
        </button>
      ))}
      {activeFilter !== "all" && (
        <button
          onClick={onClear}
          className="px-2 py-1.5 rounded-lg text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/10 transition-colors"
          aria-label="Clear filter"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
