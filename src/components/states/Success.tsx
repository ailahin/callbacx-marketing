"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/Button";

/**
 * Success State Types
 */
export interface SuccessStateProps {
  /**
   * Success title
   */
  title?: string;
  /**
   * Success message
   */
  message: string;
  /**
   * Action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    icon?: React.ReactNode;
  };
  /**
   * Secondary action
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Dismiss action
   */
  onDismiss?: () => void;
  /**
   * Show dismiss button
   */
  dismissible?: boolean;
  /**
   * Variant
   */
  variant?: "inline" | "card" | "page" | "toast" | "banner" | "modal";
  /**
   * Show celebration animation
   */
  celebrate?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Additional details
   */
  details?: string;
}

/**
 * Success Icons
 */
const successIcons = {
  default: (
    <svg className="w-10 h-10 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  celebration: (
    <svg className="w-16 h-16 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  check: (
    <svg className="w-10 h-10 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
};

const successColors = {
  bg: "bg-success-50 dark:bg-success-950/50",
  border: "border-success-200 dark:border-success-800",
  text: "text-success-700 dark:text-success-300",
  title: "text-success-900 dark:text-success-100",
};

/**
 * Icons used by the Toast component for non-success variants.
 * Defined locally to avoid a cross-file dependency on Error.tsx.
 */
const errorIcons = {
  error: (
    <svg className="w-10 h-10 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  warning: (
    <svg className="w-10 h-10 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-10 h-10 text-info-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

/**
 * Success State Component
 */
export function SuccessState({
  title = "Success!",
  message,
  action,
  secondaryAction,
  onDismiss,
  dismissible = false,
  variant = "inline",
  celebrate = false,
  className,
  details,
}: SuccessStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const icon = celebrate ? successIcons.celebration : successIcons.default;

  const renderContent = () => (
    <div className="flex flex-col items-center text-center gap-4">
      <div className={cn("flex-shrink-0", celebrate && "animate-bounce")} aria-hidden="true">
        {icon}
      </div>
      <div>
        <h2 className={cn("text-lg font-semibold", successColors.title)}>{title}</h2>
        <p className={cn("mt-2 text-base leading-relaxed", successColors.text)}>{message}</p>
      </div>
      {details && (
        <details className="w-full max-w-md text-left">
          <summary className={cn("cursor-pointer text-sm font-medium", successColors.text)}>
            Show details
          </summary>
          <pre className={cn(
            "mt-2 p-3 text-xs overflow-x-auto rounded bg-neutral-100 dark:bg-neutral-800",
            successColors.border
          )}>
            {details}
          </pre>
        </details>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {action && (
          <Button
            variant={action.variant || "primary"}
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        {dismissible && onDismiss && (
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Dismiss"
            onClick={onDismiss}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        )}
      </div>
    </div>
  );

  switch (variant) {
    case "card":
      return (
        <Card
          variant="outlined"
          className={cn(successColors.bg, successColors.border, className)}
          role="status"
          aria-live="polite"
        >
          <div className="p-6">{renderContent()}</div>
        </Card>
      );

    case "page":
      return (
        <div
          className={cn(
            "flex min-h-[60vh] items-center justify-center p-8",
            className
          )}
          role="status"
          aria-live="polite"
        >
          <div className="max-w-md w-full">{renderContent()}</div>
        </div>
      );

    case "toast":
      return (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-toast max-w-sm",
            "animate-slide-in-right",
            successColors.bg,
            successColors.border,
            "border shadow-xl rounded-xl p-4",
            className
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0" aria-hidden="true">
              {successIcons.check}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium", successColors.title)}>{title}</p>
              <p className={cn("mt-1 text-sm", successColors.text)}>{message}</p>
            </div>
            {dismissible && onDismiss && (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Dismiss"
                onClick={onDismiss}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            )}
          </div>
        </div>
      );

    case "banner":
      return (
        <div
          className={cn(
            "w-full border-b",
            successColors.bg,
            successColors.border,
            "border",
            className
          )}
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto max-w-[80rem] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                {successIcons.check}
              </div>
              <div className="flex-1">
                <p className={cn("font-medium", successColors.title)}>{title}</p>
                <p className={cn("mt-0.5 text-sm", successColors.text)}>{message}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {action && (
                  <Button size="sm" variant={action.variant || "outline"} onClick={action.onClick}>
                    {action.label}
                  </Button>
                )}
                {dismissible && onDismiss && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Dismiss"
                    onClick={onDismiss}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </IconButton>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case "modal":
      return (
        <div
          className={cn(
            "fixed inset-0 z-modal flex items-center justify-center p-4",
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" aria-hidden="true" />
          <Card
            className={cn(
              "relative z-modal w-full max-w-md animate-scale-in",
              successColors.bg,
              successColors.border,
              "border"
            )}
          >
            <div className="p-6">{renderContent()}</div>
          </Card>
        </div>
      );

    default: // inline
      return (
        <div
          className={cn(
            "flex flex-col items-center gap-4 p-6",
            successColors.bg,
            successColors.border,
            "border rounded-xl",
            className
          )}
          role="status"
          aria-live="polite"
        >
          {renderContent()}
        </div>
      );
  }
}

/**
 * Inline Success - for form fields
 */
export interface InlineSuccessProps {
  message: string;
  className?: string;
}

export function InlineSuccess({ message, className }: InlineSuccessProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm text-success-600 dark:text-success-400",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

/**
 * Confirmation Dialog - specialized success state for confirmations
 */
export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "success" | "warning" | "danger";
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "success",
  loading = false,
}: ConfirmationDialogProps) {
  if (!open) return null;

  const variantStyles = {
    success: {
      icon: successIcons.check,
      titleColor: "text-success-900 dark:text-success-100",
      buttonVariant: "primary" as const,
    },
    warning: {
      icon: (
        <svg className="w-10 h-10 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      titleColor: "text-warning-900 dark:text-warning-100",
      buttonVariant: "accent" as const,
    },
    danger: {
      icon: (
        <svg className="w-10 h-10 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      titleColor: "text-error-900 dark:text-error-100",
      buttonVariant: "destructive" as const,
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <Card className="relative z-modal w-full max-w-md animate-scale-in">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4" aria-hidden="true">{styles.icon}</div>
          <h2 id="confirm-title" className={cn("text-lg font-semibold", styles.titleColor)}>{title}</h2>
          <p className="mt-2 text-text-secondary">{message}</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant={styles.buttonVariant} onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Toast Container - for managing multiple toasts
 */
export interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({ id, type, title, message, duration = 5000, onClose, action }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const typeStyles = {
    success: { bg: "bg-success-50 dark:bg-success-950/50", border: "border-success-200 dark:border-success-800", title: "text-success-900 dark:text-success-100", text: "text-success-700 dark:text-success-300", icon: successIcons.check },
    error: { bg: "bg-error-50 dark:bg-error-950/50", border: "border-error-200 dark:border-error-800", title: "text-error-900 dark:text-error-100", text: "text-error-700 dark:text-error-300", icon: errorIcons.error },
    warning: { bg: "bg-warning-50 dark:bg-warning-950/50", border: "border-warning-200 dark:border-warning-800", title: "text-warning-900 dark:text-warning-100", text: "text-warning-700 dark:text-warning-300", icon: errorIcons.warning },
    info: { bg: "bg-info-50 dark:bg-info-950/50", border: "border-info-200 dark:border-info-800", title: "text-info-900 dark:text-info-100", text: "text-info-700 dark:text-info-300", icon: errorIcons.info },
  };

  const styles = typeStyles[type];

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-xl border shadow-xl animate-slide-in-right",
        styles.bg,
        styles.border
      )}
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className="flex-shrink-0" aria-hidden="true">{styles.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", styles.title)}>{title}</p>
        {message && <p className={cn("mt-1 text-sm", styles.text)}>{message}</p>}
        {action && (
          <Button size="sm" variant="ghost" className="mt-2" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Dismiss"
        onClick={() => onClose(id)}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </IconButton>
    </div>
  );
}

// All prop types above are already exported inline.