"use client";

/**
 * CALLBACX TECHNOLOGY — useBreakpoint Hook
 *
 * Responsive breakpoint hook for mobile-first design.
 * Matches the design tokens defined in DESIGN_TOKENS.breakpoints:
 *   xs: 320px, sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
 *
 * Reusable across web and (future) React Native via conditional rendering.
 */

import * as React from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const BREAKPOINT_PX: Record<Breakpoint, number> = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("xs");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const width = window.innerWidth;
      let bp: Breakpoint = "xs";
      if (width >= BREAKPOINT_PX["2xl"]) bp = "2xl";
      else if (width >= BREAKPOINT_PX.xl) bp = "xl";
      else if (width >= BREAKPOINT_PX.lg) bp = "lg";
      else if (width >= BREAKPOINT_PX.md) bp = "md";
      else if (width >= BREAKPOINT_PX.sm) bp = "sm";
      else bp = "xs";
      setBreakpoint(bp);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return breakpoint;
}

export function useIsMobile() {
  const bp = useBreakpoint();
  return bp === "xs" || bp === "sm";
}

export function useIsTablet() {
  const bp = useBreakpoint();
  return bp === "md";
}

export function useIsDesktop() {
  const bp = useBreakpoint();
  return bp === "lg" || bp === "xl" || bp === "2xl";
}

/**
 * BreakpointTester — development-only component to verify responsive layouts
 * at each breakpoint. Wraps children with a visible breakpoint indicator.
 */
export function BreakpointTester({
  children,
  showLabel = true,
}: {
  children: React.ReactNode;
  showLabel?: boolean;
}) {
  const bp = useBreakpoint();
  const labels: Record<Breakpoint, string> = {
    xs: "Mobile (320px+)",
    sm: "Mobile Large (640px+)",
    md: "Tablet (768px+)",
    lg: "Desktop (1024px+)",
    xl: "Desktop Large (1280px+)",
    "2xl": "Desktop XLarge (1536px+)",
  };

  return (
    <div className="relative">
      {showLabel && (
        <div className="absolute top-2 left-2 z-50 px-2 py-1 bg-brand-600 text-white text-xs font-mono rounded">
          {labels[bp]}
        </div>
      )}
      {children}
    </div>
  );
}
