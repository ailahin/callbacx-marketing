/**
 * CALLBACX MARKETING — Touch Target Utilities
 *
 * Ensures all interactive elements meet minimum touch target sizes
 * for mobile accessibility (44x44px iOS, 48x48dp Android / WCAG 2.5.5).
 */

export const MIN_TOUCH_TARGET = 44; // pixels

/**
 * Validates that a CSS size value meets minimum touch target requirements.
 * Returns the size in pixels or null if it cannot be determined.
 */
export function validateTouchTarget(size: string | number): { valid: boolean; size: number } {
  const px = typeof size === "number" ? size : parseInt(size, 10);
  return {
    valid: px >= MIN_TOUCH_TARGET,
    size: px,
  };
}

/**
 * CSS class string ensuring minimum touch target size.
 */
export const touchTargetClasses = "min-h-[44px] min-w-[44px]";

/**
 * Check if an element meets minimum touch target size.
 */
export function checkElementTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_TOUCH_TARGET && rect.height >= MIN_TOUCH_TARGET;
}
