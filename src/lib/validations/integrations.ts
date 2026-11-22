/**
 * CALLBACX TECHNOLOGY — Integration validation schemas
 *
 * Zod schemas for integration settings, connections, OAuth flows, email
 * sends and webhook processing. Kept in sync between client and server.
 */

import { z } from "zod";
import { uuid, email, pagination } from "./index";

// ---------------------------------------------------------------------------
// Integration providers
// ---------------------------------------------------------------------------

export const integrationProviderSchema = z.enum([
  "resend",
  "stripe",
  "instagram",
  "tiktok",
  "youtube",
  "supabase_storage",
  "webhook",
]);

export type IntegrationProviderInput = z.infer<typeof integrationProviderSchema>;

// ---------------------------------------------------------------------------
// Settings (admin)
// ---------------------------------------------------------------------------

export const integrationSettingUpdateSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  config: z.record(z.string(), z.any()).optional(),
  is_enabled: z.boolean().optional(),
  requires_approval: z.boolean().optional(),
  approval_status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export type IntegrationSettingUpdateInput = z.infer<typeof integrationSettingUpdateSchema>;

export const integrationCredentialSetSchema = z.object({
  provider: integrationProviderSchema,
  credential_key: z.string().min(1, "Credential key is required").max(100, "Credential key is too long"),
  value: z.string().min(1, "Credential value is required"),
});

export type IntegrationCredentialSetInput = z.infer<typeof integrationCredentialSetSchema>;

// ---------------------------------------------------------------------------
// Connections (user)
// ---------------------------------------------------------------------------

export const integrationConnectionStatusSchema = z.enum([
  "pending",
  "connected",
  "expired",
  "revoked",
  "error",
  "disconnected",
]);

export type IntegrationConnectionStatusInput = z.infer<typeof integrationConnectionStatusSchema>;

export const integrationConnectionListSchema = z.object({
  provider: integrationProviderSchema.optional(),
  status: integrationConnectionStatusSchema.optional(),
  ...pagination.shape,
});

export type IntegrationConnectionListInput = z.infer<typeof integrationConnectionListSchema>;

export const integrationDisconnectSchema = z.object({
  connection_id: uuid,
});

export type IntegrationDisconnectInput = z.infer<typeof integrationDisconnectSchema>;

// ---------------------------------------------------------------------------
// OAuth authorize / callback
// ---------------------------------------------------------------------------

export const integrationOAuthAuthorizeSchema = z.object({
  provider: integrationProviderSchema,
  redirect_to: z.string().url("Invalid redirect URL").optional().or(z.literal("")),
});

export type IntegrationOAuthAuthorizeInput = z.infer<typeof integrationOAuthAuthorizeSchema>;

export const integrationOAuthCallbackSchema = z.object({
  provider: integrationProviderSchema,
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().min(1, "OAuth state is required"),
});

export type IntegrationOAuthCallbackInput = z.infer<typeof integrationOAuthCallbackSchema>;

// ---------------------------------------------------------------------------
// Analytics sync
// ---------------------------------------------------------------------------

export const integrationSyncSchema = z.object({
  provider: integrationProviderSchema.optional(),
  connection_id: uuid.optional(),
  metric_date: z.coerce.date().optional(),
});

export type IntegrationSyncInput = z.infer<typeof integrationSyncSchema>;

// ---------------------------------------------------------------------------
// Email (Resend or equivalent)
// ---------------------------------------------------------------------------

export const integrationEmailSendSchema = z.object({
  to: email,
  subject: z.string().min(1, "Subject is required").max(300, "Subject is too long"),
  body: z.string().min(1, "Body is required"),
  template_id: z.string().max(200, "Template id is too long").optional().or(z.literal("")),
  reply_to: email.optional(),
});

export type IntegrationEmailSendInput = z.infer<typeof integrationEmailSendSchema>;

export const integrationNotificationSendSchema = z.object({
  recipient_profile_id: uuid.optional(),
  recipient_email: email,
  category: z.string().min(1, "Category is required").max(100, "Category is too long"),
  subject: z.string().min(1, "Subject is required").max(300, "Subject is too long"),
  body: z.string().min(1, "Body is required"),
  template_id: z.string().max(200, "Template id is too long").optional().or(z.literal("")),
});

export type IntegrationNotificationSendInput = z.infer<typeof integrationNotificationSendSchema>;

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export const integrationWebhookProcessSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  event_id: z.string().min(1, "Event id is required"),
  event_type: z.string().min(1, "Event type is required"),
  payload: z.record(z.string(), z.any()).default({}),
});

export type IntegrationWebhookProcessInput = z.infer<typeof integrationWebhookProcessSchema>;
