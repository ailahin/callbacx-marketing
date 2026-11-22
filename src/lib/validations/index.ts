/**
 * CALLBACX TECHNOLOGY — Shared Zod validation schemas
 *
 * Common input validators reused across all feature modules.
 * Both client and server import from here so validation rules stay in sync.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const uuid = z.string().uuid("Invalid UUID format");

export const email = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required")
  .max(254, "Email is too long");

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const confirmPassword = z.string().min(1, "Please confirm your password");

export const fullName = z
  .string()
  .min(1, "Full name is required")
  .max(100, "Full name is too long")
  .trim();

export const displayName = z
  .string()
  .min(1, "Display name is required")
  .max(100, "Display name is too long")
  .trim();

export const headline = z.string().max(200, "Headline is too long").optional().or(z.literal(""));

export const bio = z.string().max(2000, "Bio is too long").optional().or(z.literal(""));

export const url = z
  .string()
  .url("Invalid URL")
  .optional()
  .or(z.literal(""));

export const phone = z
  .string()
  .max(30, "Phone number is too long")
  .optional()
  .or(z.literal(""));

export const pagination = z
  .object({
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
  })
  .strict();

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const signupSchema = z
  .object({
    email,
    password,
    confirm_password: confirmPassword,
    full_name: fullName,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z.object({
  new_password: password,
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export const emailVerificationSchema = z.object({
  token_hash: z.string().min(1, "Verification token is required"),
  type: z.enum(["signup", "recovery"]),
});

export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const profileUpdateSchema = z.object({
  full_name: fullName.optional(),
  headline: headline,
  bio: bio,
  location: z.string().max(200, "Location is too long").optional().or(z.literal("")),
  website_url: url,
  is_public: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const brandCreateSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(200, "Brand name is too long").trim(),
  legal_name: z.string().max(200, "Legal name is too long").optional().or(z.literal("")),
  trade_name: z.string().max(200, "Trade name is too long").optional().or(z.literal("")),
  description: z.string().max(5000, "Description is too long").optional().or(z.literal("")),
  website_url: url,
  contact_email: email.optional().or(z.literal("")),
  contact_phone: phone,
  address: z.record(z.string(), z.any()).optional(),
  brand_category_id: uuid.optional(),
});

export type BrandCreateInput = z.infer<typeof brandCreateSchema>;

export const brandUpdateSchema = brandCreateSchema.partial();

export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>;

// ---------------------------------------------------------------------------
// Creator
// ---------------------------------------------------------------------------

export const creatorProfileCreateSchema = z.object({
  display_name: displayName,
  bio: bio,
  location: z.record(z.string(), z.any()).optional(),
  languages: z.array(z.string().length(2, "Language codes must be 2 letters")).optional(),
  contact_email: email.optional().or(z.literal("")),
  website_url: url,
  availability_status: z.enum(["open", "busy", "unavailable"]).optional(),
  collaboration_preferences: z.record(z.string(), z.any()).optional(),
});

export type CreatorProfileCreateInput = z.infer<typeof creatorProfileCreateSchema>;

export const creatorProfileUpdateSchema = creatorProfileCreateSchema.partial();

export type CreatorProfileUpdateInput = z.infer<typeof creatorProfileUpdateSchema>;

export const creatorSocialAccountSchema = z.object({
  platform: z
    .string()
    .min(1, "Platform is required")
    .max(50, "Platform name is too long")
    .trim(),
  username: z.string().min(1, "Username is required").max(100, "Username is too long").trim(),
  profile_url: url,
  platform_user_id: z.string().max(200, "Platform user ID is too long").optional().or(z.literal("")),
});

export type CreatorSocialAccountInput = z.infer<typeof creatorSocialAccountSchema>;

export const creatorRateSchema = z.object({
  service_type: z.string().min(1, "Service type is required").max(100, "Service type is too long"),
  min_rate: z.coerce.number().nonnegative("Minimum rate must be non-negative"),
  max_rate: z.coerce.number().nonnegative("Maximum rate must be non-negative"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
});

export type CreatorRateInput = z.infer<typeof creatorRateSchema>;

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

export const campaignCreateSchema = z.object({
  title: z.string().min(1, "Campaign title is required").max(300, "Title is too long").trim(),
  description: z.string().max(10000, "Description is too long").optional().or(z.literal("")),
  brief: z.string().max(10000, "Brief is too long").optional().or(z.literal("")),
  category_id: uuid.optional(),
  objective: z.string().max(500, "Objective is too long").optional().or(z.literal("")),
  budget_total: z.coerce.number().nonnegative("Budget must be non-negative"),
  budget_currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
  compensation_model: z.enum(["flat_fee", "per_deliverable", "performance", "negotiable"]).default("negotiable"),
  payment_terms: z.string().max(100, "Payment terms is too long").optional().or(z.literal("")),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  application_deadline: z.coerce.date().optional(),
  location_requirements: z.record(z.string(), z.any()).optional(),
  platform_requirements: z.array(z.string().max(50)).optional(),
  visibility: z.enum(["public", "brand_only", "invite_only"]).default("public"),
  approval_required: z.boolean().default(true),
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

export const campaignUpdateSchema = campaignCreateSchema.partial();

export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

export const campaignApplicationSchema = z.object({
  campaign_id: uuid,
  cover_letter: z.string().max(5000, "Cover letter is too long").optional().or(z.literal("")),
  proposed_rate: z.coerce.number().nonnegative("Proposed rate must be non-negative").optional(),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
});

export type CampaignApplicationInput = z.infer<typeof campaignApplicationSchema>;

export const applicationReviewSchema = z.object({
  application_id: uuid,
  status: z.enum(["accepted", "rejected", "under_review"]),
  rejection_reason: z.string().max(1000, "Rejection reason is too long").optional().or(z.literal("")),
});

export type ApplicationReviewInput = z.infer<typeof applicationReviewSchema>;

// ---------------------------------------------------------------------------
// Collaboration & Invitation
// ---------------------------------------------------------------------------

export const collaborationInvitationSchema = z.object({
  campaign_id: uuid,
  creator_profile_id: uuid,
  proposed_fee: z.coerce.number().nonnegative("Proposed fee must be non-negative").optional(),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
  message: z.string().max(5000, "Message is too long").optional().or(z.literal("")),
  expires_at: z.coerce.date(),
});

export type CollaborationInvitationInput = z.infer<typeof collaborationInvitationSchema>;

export const collaborationInvitationResponseSchema = z.object({
  invitation_id: uuid,
  accept: z.boolean(),
});

export type CollaborationInvitationResponseInput = z.infer<typeof collaborationInvitationResponseSchema>;

export const collaborationStatusUpdateSchema = z.object({
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
});

export type CollaborationStatusUpdateInput = z.infer<typeof collaborationStatusUpdateSchema>;

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export const messageSendSchema = z.object({
  conversation_id: uuid,
  body: z.string().max(10000, "Message is too long").optional().or(z.literal("")),
  message_type: z.enum(["text", "file", "system"]).default("text"),
});

export type MessageSendInput = z.infer<typeof messageSendSchema>;

export const conversationCreateSchema = z.object({
  type: z.enum(["direct", "group"]).default("direct"),
  title: z.string().max(200, "Title is too long").optional().or(z.literal("")),
  participant_ids: z.array(uuid).min(1, "At least one participant is required"),
});

export type ConversationCreateInput = z.infer<typeof conversationCreateSchema>;

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

export const notificationPreferenceSchema = z.object({
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  categories: z.record(z.string(), z.boolean()).optional(),
});

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;

// ---------------------------------------------------------------------------
// Payment & Invoice
// ---------------------------------------------------------------------------

export const invoiceCreateSchema = z.object({
  collaboration_id: uuid,
  invoice_number: z.string().min(1, "Invoice number is required").max(100, "Invoice number is too long"),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
  due_date: z.coerce.date().optional(),
});

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;

export const invoiceMarkPaidSchema = z.object({
  invoice_id: uuid,
});

export type InvoiceMarkPaidInput = z.infer<typeof invoiceMarkPaidSchema>;

export const refundCreateSchema = z.object({
  payment_transaction_id: uuid,
  amount: z.coerce.number().positive("Refund amount must be positive"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
  reason: z.string().max(2000, "Reason is too long").optional().or(z.literal("")),
});

export type RefundCreateInput = z.infer<typeof refundCreateSchema>;

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export const reviewCreateSchema = z.object({
  collaboration_id: uuid,
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  title: z.string().max(200, "Title is too long").optional().or(z.literal("")),
  body: z.string().max(5000, "Review body is too long").optional().or(z.literal("")),
  is_public: z.boolean().default(true),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export const uploadPresignSchema = z.object({
  bucket: z.enum([
    "brand-logos",
    "creator-avatars",
    "creator-portfolios",
    "campaign-assets",
    "deliverable-submissions",
    "contracts",
    "messages",
  ]),
  file_name: z.string().min(1, "File name is required").max(255, "File name is too long"),
  content_type: z.string().min(1, "Content type is required"),
});

export type UploadPresignInput = z.infer<typeof uploadPresignSchema>;

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminActivityLogSchema = z.object({
  action: z.string().min(1, "Action is required").max(200, "Action is too long"),
  target_type: z.string().min(1, "Target type is required").max(100, "Target type is too long"),
  target_id: uuid.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type AdminActivityLogInput = z.infer<typeof adminActivityLogSchema>;

// ---------------------------------------------------------------------------
// Helper: parse and return error map
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

export function parseZodError(error: z.ZodError): ValidationError[] {
  return error.issues.map((err) => ({
    field: err.path.join(".") || "root",
    message: err.message,
  }));
}
