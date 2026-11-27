"use server";

import { z } from "zod";

/**
 * Security utilities for admin routes: input validation, sanitization,
 * and secure response headers.
 */

/**
 * Schema for campaign search/filter — strict, minimal fields only.
 */
export const CampaignFilterSchema = z.object({
  status: z.enum(["active", "paused", "completed", "draft"]).optional(),
  brand: z.string().min(1).max(100).optional(),
  influencer: z.string().min(1).max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

export type CampaignFilter = z.infer<typeof CampaignFilterSchema>;

/**
 * Schema for creating/updating a campaign.
 */
export const CampaignSchema = z.object({
  name: z.string().min(1).max(200),
  brandName: z.string().min(1).max(200),
  influencerName: z.string().min(1).max(200),
  status: z.enum(["active", "paused", "completed", "draft"]),
  budget: z.coerce.number().min(0).max(10000000),
  currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),
});

export type CampaignInput = z.infer<typeof CampaignSchema>;

/**
 * Sanitize a string for safe display (prevents XSS by escaping HTML).
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate and sanitize campaign filter query params.
 */
export function validateCampaignFilter(
  raw: Record<string, string | string[] | undefined>
): { data: CampaignFilter; errors: string[] } {
  const errors: string[] = [];
  const parsed = CampaignFilterSchema.safeParse(raw);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join(".")}: ${issue.message}`);
    }
    return { data: CampaignFilterSchema.parse({}), errors };
  }

  return { data: parsed.data, errors };
}

/**
 * Secure response headers for admin pages.
 */
export const SECURE_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none';",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
