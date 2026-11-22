"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "callbacxtechnology-theme",
  attribute = "data-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Get initial theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey) as Theme | null;
    const initialTheme = stored || defaultTheme;
    setThemeState(initialTheme);
  }, [storageKey, defaultTheme]);

  // Resolve theme based on system preference
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    let resolved: "light" | "dark";

    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = theme;
    }

    setResolvedTheme(resolved);
    root.setAttribute(attribute, resolved);
    localStorage.setItem(storageKey, theme);
  }, [theme, mounted, storageKey, attribute]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      document.documentElement.setAttribute(attribute, resolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted, attribute]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  }, []);

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: defaultTheme, resolvedTheme: "light", setTheme: () => {}, toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Theme Toggle Button Component
 */
export interface ThemeToggleProps {
  variant?: "button" | "dropdown" | "switch";
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function ThemeToggle({
  variant = "button",
  size = "md",
  showLabels = false,
  className,
  "aria-label": ariaLabel = "Toggle theme",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: "light", label: "Light", icon: <SunIcon /> },
    { value: "dark", label: "Dark", icon: <MoonIcon /> },
    { value: "system", label: "System", icon: <MonitorIcon /> },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];

  if (variant === "switch") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={resolvedTheme === "dark"}
        aria-label={ariaLabel}
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
          resolvedTheme === "dark"
            ? "bg-brand-600 dark:bg-brand-500"
            : "bg-neutral-300 dark:bg-neutral-600",
          className
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            resolvedTheme === "dark" && "translate-x-6"
          )}
          aria-hidden="true"
        />
      </button>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className="relative inline-flex" role="group" aria-label={ariaLabel}>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-surface",
            "text-text-secondary hover:text-text-primary",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
            "transition-colors focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-brand-500"
          )}
          aria-expanded="false"
          aria-haspopup="listbox"
        >
          {currentTheme.icon}
          {showLabels && <span className="text-sm font-medium">{currentTheme.label}</span>}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {/* Dropdown would go here - simplified for now */}
      </div>
    );
  }

  // Default button variant - cycles through themes
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-border-default bg-surface",
        "text-text-secondary hover:text-text-primary",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "transition-colors focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-500",
        size === "sm" && "p-1.5 h-8",
        size === "md" && "p-2 h-10",
        size === "lg" && "p-2.5 h-12",
        className
      )}
      aria-label={ariaLabel}
      aria-pressed={theme !== "light"}
      title={`Current: ${currentTheme.label}. Click to cycle.`}
    >
      {theme === "light" ? <SunIcon /> : theme === "dark" ? <MoonIcon /> : <MonitorIcon />}
      {showLabels && <span className="text-sm font-medium capitalize">{theme}</span>}
    </button>
  );
}

/**
 * Theme Selector - dropdown with all options
 */
export function ThemeSelector({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode; description: string }> = [
    { value: "light", label: "Light", icon: <SunIcon />, description: "Always use light mode" },
    { value: "dark", label: "Dark", icon: <MoonIcon />, description: "Always use dark mode" },
    { value: "system", label: "System", icon: <MonitorIcon />, description: "Match system preference" },
  ];

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className={cn(
        "appearance-none bg-surface border border-border-default rounded-lg",
        "text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        "focus-visible:ring-offset-2",
        "dark:border-neutral-700 dark:focus-visible:ring-offset-neutral-900",
        size === "sm" && "px-3 py-1.5 text-sm pr-8",
        size === "md" && "px-4 py-2 text-base pr-10",
        size === "lg" && "px-4 py-3 text-lg pr-10",
        className
      )}
      aria-label="Select theme"
    >
      {themes.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Icons for theme toggle
 */
function SunIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function MonitorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

// All prop types above are already exported inline.

