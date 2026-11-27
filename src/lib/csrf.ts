"use server";

import { createHash, randomBytes } from "crypto";

/**
 * CSRF token utilities for admin actions.
 * Tokens are generated server-side and validated on form submissions.
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function createCsrfTokenCookie(): string {
  const token = generateCsrfToken();
  const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
  return `csrf_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Expires=${expires.toUTCString()}`;
}

export function validateCsrfToken(
  submittedToken: string | undefined,
  cookieToken: string | undefined
): boolean {
  if (!submittedToken || !cookieToken) return false;
  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(submittedToken);
  const b = Buffer.from(cookieToken);
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Hash a value for secure storage/comparison (not for passwords — use bcrypt/argon2 for those).
 */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
