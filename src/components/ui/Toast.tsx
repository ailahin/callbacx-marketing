"use client";

import * as React from "react";
import { Button, IconButton } from "@/components";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ToastItem["variant"], string> = {
  success: "bg-success-50 text-success-900 border border-success-200 dark:bg-success-950/30 dark:text-success-200 dark:border-success-800",
  error: "bg-error-50 text-error-900 border border-error-200 dark:bg-error-950/30 dark:text-error-200 dark:border-error-800",
  warning: "bg-warning-50 text-warning-900 border border-warning-200 dark:bg-warning-950/30 dark:text-warning-200 dark:border-warning-800",
  info: "bg-brand-50 text-brand-900 border border-brand-200 dark:bg-brand-950/30 dark:text-brand-200 dark:border-brand-800",
};

const VARIANT_ICON: Record<ToastItem["variant"], React.ReactNode> = {
  success: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const ToastContext = React.createContext<{
  toast: (item: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  toasts: ToastItem[];
} | null>(null);

/**
 * Hook to access the toast emitter. Must be used within a ToastProvider.
 */
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((item: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2, 10);
    const entry: ToastItem = { id, duration: 5000, ...item };
    setToasts((prev) => [...prev, entry]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, entry.duration);
    return id;
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <div className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-xl border shadow-lg p-4 animate-in slide-in-from-bottom-2 duration-200",
              VARIANT_STYLES[item.variant]
            )}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{VARIANT_ICON[item.variant]}</div>
              <div className="flex-1 min-w-0">
                {item.title && (
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                )}
                <p className="text-sm">{item.message}</p>
              </div>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss"
                className="opacity-60 hover:opacity-100 -mt-0.5"
              >
                <CloseIcon className="h-3 w-3" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
