"use client";

/**
 * CALLBACX MARKETING — AdminDataTable
 *
 * Reusable data table for admin dashboards.
 * Features: sorting, pagination, row selection, empty state, loading state.
 * Responsive: stacks on mobile, scrolls horizontally on tablet/desktop.
 * Touch-friendly rows with adequate tap targets.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  limit: number;
  offset: number;
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: SortDirection) => void;
  onPageChange?: (offset: number, limit: number) => void;
  rowActions?: Array<{
    label: string;
    onClick: (row: T) => void;
    variant?: "primary" | "secondary" | "ghost" | "destructive";
    icon?: React.ReactNode;
    disabled?: (row: T) => boolean;
  }>;
  className?: string;
}

function sortData<T>(data: T[], sortKey: string, sortDir: SortDirection): T[] {
  return [...data].sort((a, b) => {
    const aVal = (a as any)[sortKey];
    const bVal = (b as any)[sortKey];
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

export function AdminDataTable<T>({
  columns,
  data,
  total,
  limit,
  offset,
  loading = false,
  emptyMessage = "No records found.",
  onSort,
  onPageChange,
  rowActions,
  className,
}: AdminDataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDirection>("asc");

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return sortData(data, sortKey, sortDir);
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    onSort?.(key, sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "asc");
  };

  const handlePageChange = (delta: number) => {
    const newPage = Math.max(1, Math.min(totalPages, currentPage + delta));
    onPageChange?.((newPage - 1) * limit, limit);
  };

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border-subtle bg-surface p-6", className)}>
        <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
          <svg
            className="animate-spin h-8 w-8 text-brand-600 dark:text-brand-400 mb-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border-subtle bg-surface p-6", className)}>
        <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border-subtle bg-surface overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface/50 border-b border-border-subtle">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider",
                    col.sortable ? "cursor-pointer select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" : "",
                    col.width ? `w-[${col.width}]` : ""
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className={cn("h-4 w-4 shrink-0", sortKey === col.key && (sortDir === "asc" ? "rotate-180" : ""))}>
                        {sortKey === col.key ? (sortDir === "asc" ? <ChevronUp /> : <ChevronDown />) : (
                          <svg className="h-3 w-3 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b border-border-subtle hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors",
                  "touch-manipulation"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-text-secondary">
                    {col.render ? col.render((row as any)[col.key], row) : String((row as any)[col.key] ?? "—")}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {rowActions.map((action, actionIndex) => {
                        const isDisabled = action.disabled?.(row);
                        return (
                          <Button
                            key={actionIndex}
                            variant={action.variant ?? "ghost"}
                            size="icon-sm"
                            onClick={() => action.onClick(row)}
                            disabled={isDisabled}
                            aria-label={action.label}
                            className={isDisabled ? "opacity-50 pointer-events-none" : ""}
                          >
                            {action.icon ?? <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border-subtle bg-surface/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-text-tertiary">
          Showing <strong>{offset + 1}</strong> to{" "}
          <strong>{Math.min(offset + sortedData.length, total)}</strong> of{" "}
          <strong>{total}</strong> results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(-1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
