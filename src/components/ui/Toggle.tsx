"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

/**
 * Toggle - a simple checkbox-styled toggle switch.
 */
export function Toggle({ checked, defaultChecked, onChange, className, ...props }: ToggleProps) {
  return (
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={(e) => onChange?.(e.target.checked)}
      className={cn(
        "peer sr-only",
        className
      )}
      {...props}
    />
  );
}
