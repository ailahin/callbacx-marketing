/**
 * CALLBACX TECHNOLOGY Design System - Main Export
 * 
 * A premium, sophisticated design system inspired by weaving threads
 * and meaningful connections between brands, influencers, creators, and audiences.
 */

// Utilities
export { cn, formatBytes, formatNumber, formatCurrency, formatDate, formatRelativeTime, truncate, generateId, debounce, throttle, isEmpty, deepClone, getInitials, sleep, retry } from "@/lib/utils";
export type { ClassValue } from "clsx";

// Theme & Context
export { ThemeProvider, useTheme, ThemeToggle, ThemeSelector } from "@/context/ThemeProvider";
export type { ThemeContextType, ThemeToggleProps } from "@/context/ThemeProvider";

// UI Components
export { Button, ButtonGroup, IconButton, buttonVariants } from "@/components/ui/Button";
export type { ButtonProps } from "@/components/ui/Button";

export { Input, Textarea, Select, Label, FormField, Checkbox, Radio, Switch } from "@/components/ui/Input";
export type { InputProps, TextareaProps, SelectProps, LabelProps, FormFieldProps, CheckboxProps, RadioProps, SwitchProps, SelectOption } from "@/components/ui/Input";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardMedia, CardOverlay, CardGrid, CardList, StatCard, ProfileCard } from "@/components/ui/Card";
export type { CardProps, CardHeaderProps, CardMediaProps, CardOverlayProps, CardGridProps, CardFooterProps, StatCardProps, ProfileCardProps } from "@/components/ui/Card";

export { Badge, StatusBadge, Tag, TagGroup, CountBadge, badgeVariants } from "@/components/ui/Badge";
export type { BadgeProps, StatusBadgeProps, TagProps, TagGroupProps, CountBadgeProps } from "@/components/ui/Badge";

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/Sheet";
export type { SheetProps, SheetContentProps, SheetHeaderProps, SheetTitleProps, SheetDescriptionProps, SheetFooterProps, SheetCloseProps } from "@/components/ui/Sheet";

// Layout Components
export { Header } from "@/components/layout/Header";
export type { HeaderProps, NavItem, NavSection } from "@/components/layout/Header";

export { Footer, MinimalFooter } from "@/components/layout/Footer";
export type { FooterProps, FooterLink, FooterColumn, MinimalFooterProps } from "@/components/layout/Footer";

export { MobileNavigation, BottomNavigation } from "@/components/layout/MobileNavigation";
export type { MobileNavigationProps, MobileNavSection, MobileNavItem, BottomNavigationProps, BottomNavItem } from "@/components/layout/MobileNavigation";

// State Components
export { Spinner, LoadingDots, Skeleton, SkeletonCard, PageLoader, ButtonLoading, LazyLoad } from "@/components/states/Loading";
export type { SpinnerProps, LoadingDotsProps, SkeletonProps, SkeletonCardProps, PageLoaderProps, ButtonLoadingProps, LazyLoadProps } from "@/components/states/Loading";

export { EmptyState, EmptyStateCard, NoDataState, NoResultsState, NoConnectionState, FirstTimeState, ErrorEmptyState, OfflineState } from "@/components/states/Empty";
export type { EmptyStateProps, EmptyStateCardProps } from "@/components/states/Empty";

export { ErrorState, InlineError, ErrorBoundaryFallback } from "@/components/states/Error";
export type { ErrorStateProps, InlineErrorProps, ErrorBoundaryFallbackProps } from "@/components/states/Error";

export { SuccessState, InlineSuccess, ConfirmationDialog, Toast } from "@/components/states/Success";
export type { SuccessStateProps, InlineSuccessProps, ConfirmationDialogProps, ToastProps } from "@/components/states/Success";

export { ToastProvider, useToast } from "@/components/ui/Toast";
export type { ToastItem } from "@/components/ui/Toast";

// Hooks (to be created)
// export { useMediaQuery, useLocalStorage, useDebounce, useClickOutside, useOnScreen } from "@/hooks";

// Constants & Tokens (for reference)
export const DESIGN_TOKENS = {
  colors: {
    brand: {
      50: "var(--color-brand-50)",
      100: "var(--color-brand-100)",
      200: "var(--color-brand-200)",
      300: "var(--color-brand-300)",
      400: "var(--color-brand-400)",
      500: "var(--color-brand-500)",
      600: "var(--color-brand-600)",
      700: "var(--color-brand-700)",
      800: "var(--color-brand-800)",
      900: "var(--color-brand-900)",
      950: "var(--color-brand-950)",
    },
    accent: {
      50: "var(--color-accent-50)",
      100: "var(--color-accent-100)",
      200: "var(--color-accent-200)",
      300: "var(--color-accent-300)",
      400: "var(--color-accent-400)",
      500: "var(--color-accent-500)",
      600: "var(--color-accent-600)",
      700: "var(--color-accent-700)",
      800: "var(--color-accent-800)",
      900: "var(--color-accent-900)",
      950: "var(--color-accent-950)",
    },
    sage: {
      50: "var(--color-sage-50)",
      100: "var(--color-sage-100)",
      200: "var(--color-sage-200)",
      300: "var(--color-sage-300)",
      400: "var(--color-sage-400)",
      500: "var(--color-sage-500)",
      600: "var(--color-sage-600)",
      700: "var(--color-sage-700)",
      800: "var(--color-sage-800)",
      900: "var(--color-sage-900)",
      950: "var(--color-sage-950)",
    },
    neutral: {
      0: "var(--color-neutral-0)",
      50: "var(--color-neutral-50)",
      100: "var(--color-neutral-100)",
      200: "var(--color-neutral-200)",
      300: "var(--color-neutral-300)",
      400: "var(--color-neutral-400)",
      500: "var(--color-neutral-500)",
      600: "var(--color-neutral-600)",
      700: "var(--color-neutral-700)",
      800: "var(--color-neutral-800)",
      900: "var(--color-neutral-900)",
      950: "var(--color-neutral-950)",
    },
  },
  spacing: {
    0: "var(--space-0)",
    1: "var(--space-1)",
    2: "var(--space-2)",
    3: "var(--space-3)",
    4: "var(--space-4)",
    5: "var(--space-5)",
    6: "var(--space-6)",
    7: "var(--space-7)",
    8: "var(--space-8)",
    9: "var(--space-9)",
    10: "var(--space-10)",
    11: "var(--space-11)",
    12: "var(--space-12)",
    14: "var(--space-14)",
    16: "var(--space-16)",
    20: "var(--space-20)",
    24: "var(--space-24)",
    28: "var(--space-28)",
    32: "var(--space-32)",
  },
  typography: {
    fontFamilies: {
      sans: "var(--font-sans)",
      mono: "var(--font-mono)",
      display: "var(--font-display)",
    },
    fontSizes: {
      displayXL: "var(--text-display-xl)",
      displayLG: "var(--text-display-lg)",
      displayMD: "var(--text-display-md)",
      displaySM: "var(--text-display-sm)",
      h1: "var(--text-h1)",
      h2: "var(--text-h2)",
      h3: "var(--text-h3)",
      h4: "var(--text-h4)",
      h5: "var(--text-h5)",
      h6: "var(--text-h6)",
      xl: "var(--text-xl)",
      lg: "var(--text-lg)",
      base: "var(--text-base)",
      sm: "var(--text-sm)",
      xs: "var(--text-xs)",
    },
    fontWeights: {
      light: "var(--font-weight-light)",
      normal: "var(--font-weight-normal)",
      medium: "var(--font-weight-medium)",
      semibold: "var(--font-weight-semibold)",
      bold: "var(--font-weight-bold)",
    },
    lineHeights: {
      tight: "var(--leading-tight)",
      snug: "var(--leading-snug)",
      normal: "var(--leading-normal)",
      relaxed: "var(--leading-relaxed)",
      loose: "var(--leading-loose)",
    },
    letterSpacing: {
      tighter: "var(--tracking-tighter)",
      tight: "var(--tracking-tight)",
      normal: "var(--tracking-normal)",
      wide: "var(--tracking-wide)",
      wider: "var(--tracking-wider)",
      widest: "var(--tracking-widest)",
    },
  },
  borderRadius: {
    none: "var(--radius-none)",
    xs: "var(--radius-xs)",
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    "2xl": "var(--radius-2xl)",
    "3xl": "var(--radius-3xl)",
    full: "var(--radius-full)",
  },
  shadows: {
    xs: "var(--shadow-xs)",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
    "2xl": "var(--shadow-2xl)",
    inner: "var(--shadow-inner)",
    brand: "var(--shadow-brand)",
    accent: "var(--shadow-accent)",
  },
  transitions: {
    fast: "var(--transition-fast)",
    base: "var(--transition-base)",
    slow: "var(--transition-slow)",
    slower: "var(--transition-slower)",
  },
  zIndex: {
    hide: "var(--z-hide)",
    base: "var(--z-base)",
    dropdown: "var(--z-dropdown)",
    sticky: "var(--z-sticky)",
    fixed: "var(--z-fixed)",
    modalBackdrop: "var(--z-modal-backdrop)",
    modal: "var(--z-modal)",
    popover: "var(--z-popover)",
    tooltip: "var(--z-tooltip)",
    toast: "var(--z-toast)",
    max: "var(--z-max)",
  },
  breakpoints: {
    xs: "320px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;

// Version
export const VERSION = "1.0.0";

// Component Categories for Documentation
export const COMPONENT_CATEGORIES = {
  primitives: ["Button", "IconButton", "ButtonGroup", "Badge", "Tag", "CountBadge", "StatusBadge"],
  forms: ["Input", "Textarea", "Select", "Label", "FormField", "Checkbox", "Radio", "Switch"],
  layout: ["Card", "CardHeader", "CardContent", "CardFooter", "CardMedia", "CardOverlay", "CardGrid", "CardList", "StatCard", "ProfileCard", "Sheet", "Header", "Footer", "MobileNavigation", "BottomNavigation"],
  states: ["Spinner", "LoadingDots", "Skeleton", "SkeletonCard", "PageLoader", "ButtonLoading", "LazyLoad", "EmptyState", "EmptyStateCard", "ErrorState", "InlineError", "SuccessState", "InlineSuccess", "ConfirmationDialog", "Toast"],
  theme: ["ThemeProvider", "useTheme", "ThemeToggle", "ThemeSelector"],
} as const;

