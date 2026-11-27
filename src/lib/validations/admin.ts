/**
 * CALLBACX TECHNOLOGY — Admin Validation Schemas
 *
 * Shared Zod validation schemas for all admin domain inputs.
 * Used by both Next.js API route handlers and (future) Expo mobile clients.
 */

import { z } from "zod";
import { uuid, email, pagination } from "@/lib/validations";

// ---------------------------------------------------------------------------
// Pagination (reused across all list endpoints)
// ---------------------------------------------------------------------------

export const adminPaginationSchema = pagination;

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

export const adminUserListSchema = z
  .object({
    search: z.string().max(200).optional(),
    role: z.string().max(100).optional(),
    status: z
      .enum(["active", "suspended", "banned", "deleted"])
      .optional(),
    brand_id: uuid.optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminUserListInput = z.infer<typeof adminUserListSchema>;

export const adminUserUpdateSchema = z
  .object({
    role: z.string().min(1, "Role is required").max(100, "Role is too long"),
    status: z
      .enum(["active", "suspended", "banned", "deleted"])
      .optional(),
  })
  .strict();

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

// ---------------------------------------------------------------------------
// Brand verification
// ---------------------------------------------------------------------------

export const adminBrandListSchema = z
  .object({
    search: z.string().max(200).optional(),
    verification_status: z
      .enum(["pending", "verified", "rejected", "expired"])
      .optional(),
    is_active: z.boolean().optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminBrandListInput = z.infer<typeof adminBrandListSchema>;

export const brandVerificationSchema = z
  .object({
    brand_id: uuid,
    status: z.enum(["pending", "verified", "rejected", "expired"]),
    reason: z.string().max(1000, "Reason is too long").optional().or(z.literal("")),
  })
  .strict();

export type BrandVerificationInput = z.infer<typeof brandVerificationSchema>;

// ---------------------------------------------------------------------------
// Creator verification
// ---------------------------------------------------------------------------

export const adminCreatorListSchema = z
  .object({
    search: z.string().max(200).optional(),
    verification_status: z
      .enum(["pending", "verified", "rejected", "expired"])
      .optional(),
    is_public: z.boolean().optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminCreatorListInput = z.infer<typeof adminCreatorListSchema>;

export const creatorVerificationSchema = z
  .object({
    creator_profile_id: uuid,
    status: z.enum(["pending", "verified", "rejected", "expired"]),
    reason: z.string().max(1000, "Reason is too long").optional().or(z.literal("")),
  })
  .strict();

export type CreatorVerificationInput = z.infer<typeof creatorVerificationSchema>;

// ---------------------------------------------------------------------------
// Campaign moderation
// ---------------------------------------------------------------------------

export const adminCampaignListSchema = z
  .object({
    search: z.string().max(200).optional(),
    status: z
      .enum([
        "draft",
        "pending_approval",
        "published",
        "paused",
        "completed",
        "archived",
        "cancelled",
      ])
      .optional(),
    brand_id: uuid.optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminCampaignListInput = z.infer<typeof adminCampaignListSchema>;

export const campaignModerationSchema = z
  .object({
    campaign_id: uuid,
    action: z.enum(["publish", "pause", "archive", "cancel", "reject"]),
    reason: z.string().max(1000, "Reason is too long").optional().or(z.literal("")),
  })
  .strict();

export type CampaignModerationInput = z.infer<typeof campaignModerationSchema>;

// ---------------------------------------------------------------------------
// Collaboration monitoring
// ---------------------------------------------------------------------------

export const adminCollaborationListSchema = z
  .object({
    search: z.string().max(200).optional(),
    status: z
      .enum([
        "negotiating",
        "active",
        "paused",
        "completed",
        "cancelled",
        "disputed",
      ])
      .optional(),
    campaign_id: uuid.optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminCollaborationListInput = z.infer<
  typeof adminCollaborationListSchema
>;

export const collaborationStatusUpdateSchema = z
  .object({
    collaboration_id: uuid,
    status: z.enum([
      "negotiating",
      "active",
      "paused",
      "completed",
      "cancelled",
      "disputed",
    ]),
    reason: z.string().max(1000, "Reason is too long").optional().or(z.literal("")),
  })
  .strict();

export type CollaborationStatusUpdateInput = z.infer<
  typeof collaborationStatusUpdateSchema
>;

// ---------------------------------------------------------------------------
// Payments and transactions
// ---------------------------------------------------------------------------

export const adminPaymentListSchema = z
  .object({
    search: z.string().max(200).optional(),
    status: z
      .enum([
        "pending",
        "succeeded",
        "failed",
        "refunded",
        "partially_refunded",
        "cancelled",
      ])
      .optional(),
    provider: z.string().max(100).optional(),
    start_date: z.string().datetime({ offset: true }).optional(),
    end_date: z.string().datetime({ offset: true }).optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminPaymentListInput = z.infer<typeof adminPaymentListSchema>;

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export const adminDisputeListSchema = z
  .object({
    search: z.string().max(200).optional(),
    status: z.enum(["open", "in_review", "resolved", "closed"]).optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminDisputeListInput = z.infer<typeof adminDisputeListSchema>;

export const disputeResolutionSchema = z
  .object({
    dispute_id: uuid,
    status: z.enum(["open", "in_review", "resolved", "closed"]),
    resolution: z.string().max(2000, "Resolution is too long").optional().or(z.literal("")),
  })
  .strict();

export type DisputeResolutionInput = z.infer<typeof disputeResolutionSchema>;

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------

export const adminSupportTicketListSchema = z
  .object({
    search: z.string().max(200).optional(),
    status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assigned_to: uuid.optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminSupportTicketListInput = z.infer<
  typeof adminSupportTicketListSchema
>;

export const supportTicketAssignmentSchema = z
  .object({
    ticket_id: uuid,
    assigned_to: uuid.nullable(),
  })
  .strict();

export type SupportTicketAssignmentInput = z.infer<
  typeof supportTicketAssignmentSchema
>;

// ---------------------------------------------------------------------------
// Moderation reports
// ---------------------------------------------------------------------------

export const adminModerationReportListSchema = z
  .object({
    search: z.string().max(200).optional(),
    status: z.enum(["pending", "reviewed", "dismissed", "actioned"]).optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminModerationReportListInput = z.infer<
  typeof adminModerationReportListSchema
>;

// ---------------------------------------------------------------------------
// Notifications / announcements
// ---------------------------------------------------------------------------

export const announcementCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    body: z.string().min(1, "Body is required").max(5000, "Body is too long"),
    target_role: z
      .string()
      .max(100, "Target role is too long")
      .optional()
      .or(z.literal("")),
    expires_at: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;

export const announcementUpdateSchema = announcementCreateSchema.partial();

export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>;

export const announcementListSchema = z
  .object({
    search: z.string().max(200).optional(),
    target_role: z.string().max(100).optional(),
    ...pagination.shape,
  })
  .strict();

export type AnnouncementListInput = z.infer<typeof announcementListSchema>;

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export const platformSettingUpsertSchema = z
  .object({
    setting_key: z.string().min(1, "Setting key is required").max(200, "Key is too long"),
    setting_value: z.record(z.string(), z.any()).optional().or(z.literal("")),
    category: z.string().min(1, "Category is required").max(100, "Category is too long"),
    is_public: z.boolean().optional(),
  })
  .strict();

export type PlatformSettingUpsertInput = z.infer<typeof platformSettingUpsertSchema>;

export const platformSettingListSchema = z
  .object({
    category: z.string().max(100).optional(),
    search: z.string().max(200).optional(),
    ...pagination.shape,
  })
  .strict();

export type PlatformSettingListInput = z.infer<typeof platformSettingListSchema>;

// ---------------------------------------------------------------------------
// Activity logs
// ---------------------------------------------------------------------------

export const adminActivityLogListSchema = z
  .object({
    admin_id: uuid.optional(),
    action: z.string().max(200).optional(),
    target_type: z.string().max(100).optional(),
    ...pagination.shape,
  })
  .strict();

export type AdminActivityLogListInput = z.infer<
  typeof adminActivityLogListSchema
>;

// ---------------------------------------------------------------------------
// Overview metrics
// ---------------------------------------------------------------------------

export const overviewMetricsSchema = z
  .object({
    start_date: z.string().date().optional(),
    end_date: z.string().date().optional(),
  })
  .strict();

export type OverviewMetricsInput = z.infer<typeof overviewMetricsSchema>;
