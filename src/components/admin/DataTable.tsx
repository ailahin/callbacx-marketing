"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    format?: (value: unknown) => string | React.ReactNode;
    width?: string;
  }>;
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

interface SortState {
  key: string;
  direction: "asc" | "desc";
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState | null>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 25;

  const sortedData = React.useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sort]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const currentPageData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 p-8 text-center dark:border-neutral-800">
        <p className="text-text-tertiary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface dark:bg-neutral-800 overflow-hidden shadow-sm dark:border-neutral-800">
      <table className="w-full text-sm text-left">
        <thead className="bg-neutral-50/50 dark:bg-neutral-800/30">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-subtle dark:border-neutral-800",
                  col.sortable ? "cursor-pointer select-none hover:bg-neutral-100 dark:hover:bg-neutral-800/50" : "",
                  col.width ? `w-[${col.width}]` : ""
                )}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && (
                    <span className={cn("h-4 w-4 shrink-0", sort?.key === col.key ? "text-brand-600 dark:text-brand-400" : "text-text-tertiary")}>
                      {sort?.key === col.key
                        ? sort.direction === "asc"
                          ? <ChevronUp className="h-3 w-3" />
                          : <ChevronDown className="h-3 w-3" />
                        : <span className="h-3 w-3 text-text-tertiary/50" />}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle dark:divide-neutral-800">
          {currentPageData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors",
                onRowClick ? "cursor-pointer" : ""
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-6 py-4 border-b border-border-subtle dark:border-neutral-800 text-text-primary"
                >
                  {col.format ? col.format(row[col.key]) : String(row[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="border-t border-border-subtle dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 px-6 py-3 flex items-center justify-between text-xs">
          <span className="text-text-secondary">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, sortedData.length)} of {sortedData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={cn("px-2 py-1 rounded-md text-text-secondary hover:text-text-primary transition-colors", page === 1 && "opacity-50 cursor-not-allowed")}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 py-1 text-text-primary">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className={cn("px-2 py-1 rounded-md text-text-secondary hover:text-text-primary transition-colors", page === totalPages && "opacity-50 cursor-not-allowed")}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
