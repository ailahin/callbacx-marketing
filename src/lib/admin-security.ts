import type { Metadata } from "next";

/**
 * Security headers middleware for admin routes.
 * Applied via next.config.ts headers or per-route layout.
 */
export const ADMIN_SECURE_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * Middleware helper to validate CSRF token from cookies.
 * Used in Server Actions for admin mutations.
 */
export function validateAdminCsrf(
  submittedToken: string | undefined,
  cookieToken: string | undefined
): { valid: boolean; reason?: string } {
  if (!submittedToken) {
    return { valid: false, reason: "Missing CSRF token" };
  }
  if (!cookieToken) {
    return { valid: false, reason: "Missing CSRF cookie" };
  }
  if (submittedToken.length !== cookieToken.length) {
    return { valid: false, reason: "CSRF token length mismatch" };
  }
  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < submittedToken.length; i++) {
    result |= submittedToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return { valid: result === 0 };
}
