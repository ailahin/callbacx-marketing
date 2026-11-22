"use client";

import * as React from "react";
import { createContext } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/Button";

/**
 * Sheet Types
 */
export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface SheetCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

/**
 * Sheet Context
 */
interface SheetContextType {
  close: () => void;
  side: "left" | "right" | "top" | "bottom";
}

const SheetContext = createContext<SheetContextType | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within Sheet");
  }
  return context;
}

/**
 * Sheet Root Component
 */
export const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(
  ({ open, onOpenChange, children, side = "right", size = "md", className, ...props }, ref) => {
    const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          close();
        }
      };

      if (open) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [open, close]);

    if (!open) return null;

    const sizeStyles = {
      sm: side === "top" || side === "bottom" ? "h-[25vh] max-h-[300px]" : "w-[300px] max-w-[85vw]",
      md: side === "top" || side === "bottom" ? "h-[40vh] max-h-[500px]" : "w-[400px] max-w-[90vw]",
      lg: side === "top" || side === "bottom" ? "h-[60vh] max-h-[700px]" : "w-[500px] max-w-[95vw]",
      xl: side === "top" || side === "bottom" ? "h-[80vh] max-h-[900px]" : "w-[600px] max-w-[100vw]",
      full: "h-full w-full",
    };

    const sideStyles = {
      left: "left-0 animate-slide-in-left",
      right: "right-0 animate-slide-in-right",
      top: "top-0 animate-slide-in-top",
      bottom: "bottom-0 animate-slide-in-bottom",
    };

    return createPortal(
      <div className="fixed inset-0 z-modal-backdrop flex" {...props}>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={close}
          aria-hidden="true"
        />
        
        {/* Sheet Content */}
        <div
          ref={ref}
          className={cn(
            "relative z-modal flex flex-col bg-surface shadow-2xl",
            "rounded-t-lg sm:rounded-xl",
            sizeStyles[size],
            sideStyles[side],
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          <SheetContext.Provider value={{ close, side }}>
            {children}
          </SheetContext.Provider>
        </div>
      </div>,
      document.body
    );
  }
);

Sheet.displayName = "Sheet";

/**
 * Sheet Trigger
 */
export const SheetTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, onClick, ...props }, ref) => {
    const { close } = useSheetContext();
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn("inline-flex items-center justify-center", className)}
        onClick={(e) => {
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SheetTrigger.displayName = "SheetTrigger";

/**
 * Sheet Content
 */
export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SheetContent.displayName = "SheetContent";

/**
 * Sheet Header
 */
export const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-2 p-6 border-b border-border-subtle", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SheetHeader.displayName = "SheetHeader";

/**
 * Sheet Title
 */
export const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn("text-lg font-semibold text-text-primary", className)}
        {...props}
      >
        {children}
      </h2>
    );
  }
);

SheetTitle.displayName = "SheetTitle";

/**
 * Sheet Description
 */
export const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-text-secondary", className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

SheetDescription.displayName = "SheetDescription";

/**
 * Sheet Footer
 */
export const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3 p-6 border-t border-border-subtle", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SheetFooter.displayName = "SheetFooter";

/**
 * Sheet Close Button
 */
export const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { close } = useSheetContext();

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg",
          "text-text-tertiary hover:text-text-primary",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "transition-colors focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand-500",
          className
        )}
        onClick={(e) => {
          close();
          onClick?.(e);
        }}
        {...props}
      >
        {children || (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    );
  }
);

SheetClose.displayName = "SheetClose";

// All prop types above are already exported inline.