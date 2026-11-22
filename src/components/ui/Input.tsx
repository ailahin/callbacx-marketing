"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input component with multiple variants, sizes, and states
 * Designed for accessibility and form integration
 */

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Label text
   */
  label?: string;
  /**
   * Helper/hint text
   */
  helperText?: string;
  /**
   * Error message (shows error state)
   */
  error?: string;
  /**
   * Icon to show before input
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to show after input
   */
  rightIcon?: React.ReactNode;
  /**
   * Variant style
   */
  variant?: "default" | "filled" | "outlined";
  /**
   * Input size
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to show clear button when value exists
   */
  clearable?: boolean;
  /**
   * Whether input is in loading state
   */
  loading?: boolean;
  /**
   * Callback when the clear button is clicked
   */
  onClear?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      variant = "outlined",
      size = "md",
      clearable,
      loading,
      disabled,
      required,
      id,
      type = "text",
      value,
      onChange,
      onBlur,
      onClear,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${React.useId()}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

    const baseStyles = [
      "w-full transition-all duration-150 ease-out",
      "bg-surface border",
      "placeholder:text-neutral-400",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-800",
      "selection:bg-brand-200 selection:text-brand-900 dark:selection:bg-brand-800 dark:selection:text-brand-100",
    ];

    const variantStyles = {
      default: [
        "border-border-default",
        "hover:border-border-strong",
        "focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:border-neutral-700 dark:hover:border-neutral-600 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
      filled: [
        "bg-neutral-100 border-transparent",
        "hover:bg-neutral-200",
        "focus-visible:bg-surface focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-900 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
      outlined: [
        "bg-surface border-2 border-border-default",
        "hover:border-border-strong",
        "focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:border-neutral-700 dark:hover:border-neutral-600 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-sm rounded-md gap-2",
      md: "h-10 px-4 text-base rounded-lg gap-2",
      lg: "h-12 px-4 text-lg rounded-xl gap-2.5",
    };

    const hasValue = value !== undefined && value !== "";
    const showClear = clearable && hasValue && !disabled && !loading && !error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {label}
            {required && <span className="text-error-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <div
            className={cn(
              "relative flex items-center",
              variantStyles[variant],
              sizeStyles[size],
              baseStyles,
              error && [
                "border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/20",
                "dark:focus-visible:border-error-400 dark:focus-visible:ring-error-400/20",
              ],
              className
            )}
          >
            {leftIcon && (
              <div
                className="absolute left-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500"
                aria-hidden="true"
              >
                {leftIcon}
              </div>
            )}
            <input
              ref={ref}
              id={inputId}
              type={type}
              className={cn(
                "flex-1 bg-transparent border-none outline-none",
                "placeholder:text-neutral-400",
                leftIcon && "pl-10",
                (rightIcon || showClear || loading) && "pr-10",
                disabled && "cursor-not-allowed"
              )}
              disabled={disabled || loading}
              required={required}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={describedBy}
              aria-busy={loading}
              {...props}
            />
            {loading && (
              <div
                className="absolute right-3 flex items-center text-neutral-400"
                aria-hidden="true"
              >
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
            {showClear && (
              <button
                type="button"
                className="absolute right-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-0.5 rounded"
                onClick={(e) => {
                  e.preventDefault();
                  onClear?.(e);
                }}
                aria-label="Clear input"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            {rightIcon && !showClear && !loading && (
              <div
                className="absolute right-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500"
                aria-hidden="true"
              >
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-error-600 dark:text-error-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * Textarea component
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  maxLength?: number;
  showCharacterCount?: boolean;
  minRows?: number;
  maxRows?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      variant = "outlined",
      size = "md",
      maxLength,
      showCharacterCount = false,
      minRows = 3,
      maxRows,
      disabled,
      required,
      id,
      value,
      onChange,
      onBlur,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${React.useId()}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText && !error ? `${textareaId}-helper` : undefined;
    const countId = showCharacterCount && maxLength ? `${textareaId}-count` : undefined;
    const describedBy = [errorId, helperId, countId].filter(Boolean).join(" ") || undefined;

    const baseStyles = [
      "w-full transition-all duration-150 ease-out resize-none",
      "bg-surface border",
      "placeholder:text-neutral-400",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-800",
      "selection:bg-brand-200 selection:text-brand-900 dark:selection:bg-brand-800 dark:selection:text-brand-100",
      "font-sans",
    ];

    const variantStyles = {
      default: [
        "border-border-default",
        "hover:border-border-strong",
        "focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:border-neutral-700 dark:hover:border-neutral-600 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
      filled: [
        "bg-neutral-100 border-transparent",
        "hover:bg-neutral-200",
        "focus-visible:bg-surface focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-900 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
      outlined: [
        "bg-surface border-2 border-border-default",
        "hover:border-border-strong",
        "focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:border-neutral-700 dark:hover:border-neutral-600 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
    };

    const sizeStyles = {
      sm: "px-3 py-2 text-sm rounded-md",
      md: "px-4 py-3 text-base rounded-lg",
      lg: "px-4 py-4 text-lg rounded-xl",
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (maxLength && e.target.value.length > maxLength) return;
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {label}
            {required && <span className="text-error-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            className={cn(
              baseStyles,
              variantStyles[variant],
              sizeStyles[size],
              error && [
                "border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/20",
                "dark:focus-visible:border-error-400 dark:focus-visible:ring-error-400/20",
              ],
              className
            )}
            disabled={disabled}
            required={required}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            rows={minRows}
            style={{
              minHeight: undefined,
              maxHeight: maxRows ? `${maxRows * 1.5}rem` : undefined,
            }}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            {...props}
          />
          {maxRows && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  const textarea = document.getElementById('${textareaId}');
                  if (textarea) {
                    textarea.addEventListener('input', function() {
                      this.style.height = 'auto';
                      this.style.height = Math.min(this.scrollHeight, ${maxRows * 24}) + 'px';
                    });
                  }
                `,
              }}
            />
          )}
        </div>
        <div className="flex justify-between mt-1.5">
          {error && (
            <p id={errorId} className="text-sm text-error-600 dark:text-error-400" role="alert">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={helperId} className="text-sm text-text-tertiary">
              {helperText}
            </p>
          )}
          {showCharacterCount && maxLength && (
            <p
              id={countId}
              className={cn(
                "text-sm font-mono tabular-nums",
                value && String(value).length >= maxLength ? "text-error-500" : "text-text-tertiary"
              )}
              aria-live="polite"
            >
              {value ? String(value).length : 0} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

/**
 * Select component
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  clearable?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      options,
      placeholder,
      variant = "outlined",
      size = "md",
      clearable,
      disabled,
      required,
      id,
      value,
      onChange,
      onBlur,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${React.useId()}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText && !error ? `${selectId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

    const hasValue = value !== undefined && value !== "";
    const showClear = clearable && hasValue && !disabled && !error;

    const baseStyles = [
      "w-full appearance-none transition-all duration-150 ease-out",
      "bg-surface border",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-800",
    ];

    const variantStyles = {
      default: [
        "border-border-default",
        "hover:border-border-strong",
        "focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:border-neutral-700 dark:hover:border-neutral-600 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
      filled: [
        "bg-neutral-100 border-transparent",
        "hover:bg-neutral-200",
        "focus-visible:bg-surface focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:bg-neutral-900 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
      outlined: [
        "bg-surface border-2 border-border-default",
        "hover:border-border-strong",
        "focus-visible:border-brand-500 focus-visible:ring-brand-500/20 focus-visible:ring-offset-surface",
        "dark:border-neutral-700 dark:hover:border-neutral-600 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/20 dark:focus-visible:ring-offset-neutral-900",
      ],
    };

    const sizeStyles = {
      sm: "h-9 px-3 pr-10 text-sm rounded-md",
      md: "h-10 px-4 pr-10 text-base rounded-lg",
      lg: "h-12 px-4 pr-10 text-lg rounded-xl",
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {label}
            {required && <span className="text-error-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              baseStyles,
              variantStyles[variant],
              sizeStyles[size],
              error && [
                "border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/20",
                "dark:focus-visible:border-error-400 dark:focus-visible:ring-error-400/20",
              ],
              className
            )}
            disabled={disabled}
            required={required}
            value={value || ""}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 dark:text-neutral-500"
            aria-hidden="true"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {showClear && (
            <button
              type="button"
              className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-0.5 rounded"
              onClick={(e) => {
                e.preventDefault();
                onChange?.({ target: { value: "" } } as React.ChangeEvent<HTMLSelectElement>);
              }}
              aria-label="Clear selection"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-error-600 dark:text-error-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

/**
 * Label component
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  helperText?: string;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, helperText, children, htmlFor, ...props }, ref) => {
    const labelId = htmlFor ? `${htmlFor}-label` : undefined;
    const helperId = helperText ? `${htmlFor}-helper` : undefined;

    return (
      <label
        ref={ref}
        id={labelId}
        htmlFor={htmlFor}
        className={cn("block text-sm font-medium text-text-primary", className)}
        {...props}
      >
        {children}
        {required && <span className="text-error-500 ml-1" aria-hidden="true">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";

/**
 * FormField wrapper for consistent form layout
 */
export interface FormFieldProps {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function FormField({
  label,
  helperText,
  error,
  required,
  children,
  htmlFor,
  className,
}: FormFieldProps) {
  const fieldId = htmlFor || `field-${React.useId()}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText && !error ? `${fieldId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label htmlFor={fieldId} required={required} helperText={helperText}>
          {label}
        </Label>
      )}
      <div>
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
              id: fieldId,
              "aria-describedby": describedBy,
              "aria-invalid": error ? "true" : "false",
              error,
            })
          : children}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-error-600 dark:text-error-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && !label && (
        <p id={helperId} className="mt-1.5 text-sm text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Checkbox component
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate, disabled, required, id, onCheckedChange, onChange, ...props }, ref) => {
    const checkboxId = id || `checkbox-${React.useId()}`;
    const descriptionId = description ? `${checkboxId}-desc` : undefined;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "h-4 w-4 appearance-none transition-all duration-150",
              "rounded-md border-2 border-border-default",
              "bg-surface",
              "checked:bg-brand-600 checked:border-brand-600",
              "checked:after:content-[''] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:w-1.5 checked:after:h-2.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-white checked:after:rotate-45",
              "indeterminate:bg-brand-600 indeterminate:border-brand-600",
              "indeterminate:after:content-[''] indeterminate:after:absolute indeterminate:after:left-1/2 indeterminate:after:top-1/2 indeterminate:after:-translate-x-1/2 indeterminate:after:-translate-y-1/2 indeterminate:after:w-1.5 indeterminate:after:h-0.5 indeterminate:after:bg-white",
              "hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "dark:border-neutral-700 dark:hover:border-brand-800 dark:focus-visible:ring-offset-neutral-900",
              className
            )}
            disabled={disabled}
            required={required}
            aria-describedby={descriptionId}
            onChange={handleChange}
            {...props}
          />
          {indeterminate && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <div className="w-1.5 h-0.5 bg-white rounded" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                "block text-sm font-medium text-text-primary cursor-pointer",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="mt-0.5 text-sm text-text-tertiary">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

/**
 * Radio component
 */
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, disabled, required, id, ...props }, ref) => {
    const radioId = id || `radio-${React.useId()}`;
    const descriptionId = description ? `${radioId}-desc` : undefined;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={cn(
              "h-4 w-4 appearance-none transition-all duration-150",
              "rounded-full border-2 border-border-default",
              "bg-surface",
              "checked:border-brand-600",
              "checked:after:content-[''] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:w-1.5 checked:after:h-1.5 checked:after:bg-brand-600 checked:after:rounded-full",
              "hover:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "dark:border-neutral-700 dark:hover:border-brand-800 dark:focus-visible:ring-offset-neutral-900",
              className
            )}
            disabled={disabled}
            required={required}
            aria-describedby={descriptionId}
            {...props}
          />
        </div>
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={radioId}
              className={cn(
                "block text-sm font-medium text-text-primary cursor-pointer",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="mt-0.5 text-sm text-text-tertiary">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Radio.displayName = "Radio";

/**
 * Switch component
 */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = "md", disabled, required, id, onCheckedChange, onChange, ...props }, ref) => {
    const switchId = id || `switch-${React.useId()}`;
    const descriptionId = description ? `${switchId}-desc` : undefined;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    const sizeStyles = {
      sm: "w-8 h-5",
      md: "w-11 h-6",
      lg: "w-14 h-7",
    };

    const thumbStyles = {
      sm: "w-4 h-4 translate-x-0.5",
      md: "w-5 h-5 translate-x-0.5",
      lg: "w-6 h-6 translate-x-0.5",
    };

    const thumbCheckedStyles = {
      sm: "translate-x-full -translate-x-1",
      md: "translate-x-full -translate-x-1",
      lg: "translate-x-full -translate-x-1",
    };

    return (
      <div className="flex items-center gap-3">
        <label
          htmlFor={switchId}
          className={cn(
            "relative inline-flex items-center cursor-pointer transition-colors",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            role="switch"
            className="sr-only"
            disabled={disabled}
            required={required}
            aria-describedby={descriptionId}
            onChange={handleChange}
            {...props}
          />
          <span
            className={cn(
              "inline-block rounded-full bg-neutral-300 transition-all duration-200 ease-out",
              "hover:bg-neutral-400",
              "checked:bg-brand-600 checked:hover:bg-brand-500",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              "dark:bg-neutral-600 dark:hover:bg-neutral-500 dark:checked:bg-brand-500 dark:checked:hover:bg-brand-400 dark:focus-visible:ring-offset-neutral-900",
              "disabled:bg-neutral-200 dark:disabled:bg-neutral-700",
              sizeStyles[size]
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                "inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
                "transform",
                thumbStyles[size],
                "checked:" + thumbCheckedStyles[size]
              )}
              aria-hidden="true"
            />
          </span>
        </label>
        <div className="flex-1 min-w-0">
          {label && (
            <span className={cn("text-sm font-medium text-text-primary", disabled && "opacity-50")}>
              {label}
            </span>
          )}
          {description && (
            <p id={descriptionId} className="mt-0.5 text-sm text-text-tertiary">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Switch.displayName = "Switch";

// All prop types above are already exported inline.