/**
 * CALLBACX MARKETING — Shared Admin Types
 *
 * Platform-agnostic TypeScript types for the admin dashboard.
 * These types are shared between the Next.js web dashboard and a future
 * Expo / React Native mobile admin app. Import from here instead of
 * duplicating shapes across platforms.
 */

import type {
  Profiles,
  Brands,
  CreatorProfiles,
  Campaigns,
  Collaborations,
  PaymentTransactions,
  Invoices,
  CreatorPayouts,
  Disputes,
  SupportTickets,
  ModerationReports,
  PlatformSettings,
  SystemNotifications,
  AdminActivityLogs,
  Notifications,
  DisputeStatus,
  TicketStatus,
  TicketPriority,
  ReportStatus,
  PaymentStatus,
  InvoiceStatus,
  PayoutStatus,
  CampaignStatus,
  CollaborationStatus,
  AccountStatus,
  VerificationStatus,
} from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Re-export database enums so mobile and web stay in sync
// ---------------------------------------------------------------------------

export type { DisputeStatus, TicketStatus, TicketPriority, ReportStatus };
export type { PaymentStatus, InvoiceStatus, PayoutStatus };
export type { CampaignStatus, CollaborationStatus };
export type { AccountStatus, VerificationStatus };

// ---------------------------------------------------------------------------
// Admin domain types (platform-agnostic)
// ---------------------------------------------------------------------------

/** A user profile as seen by admins. */
export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  status: AccountStatus;
  brand_id: string | null;
  creator_profile_id: string | null;
  last_active_at: string | null;
  created_at: string;
  permissions: string[];
}

/** Filter options for listing admin users. */
export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: AccountStatus;
  brand_id?: string;
  limit?: number;
  offset?: number;
}

/** Input for updating a user's role / status. */
export interface AdminUserUpdateInput {
  role?: string;
  status?: AccountStatus;
}

/** A brand as seen by admins, with verification state. */
export interface AdminBrand {
  id: string;
  name: string;
  legal_name: string | null;
  trade_name: string | null;
  contact_email: string | null;
  website_url: string | null;
  verification_status: VerificationStatus;
  is_active: boolean;
  owner_id: string;
  owner_name: string | null;
  member_count: number;
  campaign_count: number;
  created_at: string;
}

/** Filter options for listing brands. */
export interface AdminBrandFilters {
  search?: string;
  verification_status?: VerificationStatus;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

/** Input for brand verification actions. */
export interface BrandVerificationInput {
  brand_id: string;
  status: VerificationStatus;
  reason?: string;
}

/** A creator profile as seen by admins, with verification state. */
export interface AdminCreator {
  id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  verification_status: VerificationStatus;
  is_public: boolean;
  profile_id: string;
  creator_name: string | null;
  email: string | null;
  follower_count: number | null;
  collaboration_count: number;
  created_at: string;
}

/** Filter options for listing creators. */
export interface AdminCreatorFilters {
  search?: string;
  verification_status?: VerificationStatus;
  is_public?: boolean;
  limit?: number;
  offset?: number;
}

/** Input for creator verification actions. */
export interface CreatorVerificationInput {
  creator_profile_id: string;
  status: VerificationStatus;
  reason?: string;
}

/** A campaign as seen by admins. */
export interface AdminCampaign {
  id: string;
  title: string;
  status: CampaignStatus;
  budget_total: number;
  budget_currency: string;
  brand_id: string;
  brand_name: string | null;
  creator_count: number;
  application_count: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

/** Filter options for listing campaigns. */
export interface AdminCampaignFilters {
  search?: string;
  status?: CampaignStatus;
  brand_id?: string;
  limit?: number;
  offset?: number;
}

/** A collaboration as seen by admins. */
export interface AdminCollaboration {
  id: string;
  campaign_id: string;
  campaign_title: string | null;
  creator_id: string;
  creator_name: string | null;
  brand_id: string;
  brand_name: string | null;
  status: CollaborationStatus;
  fee_amount: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

/** Filter options for listing collaborations. */
export interface AdminCollaborationFilters {
  search?: string;
  status?: CollaborationStatus;
  campaign_id?: string;
  limit?: number;
  offset?: number;
}

/** A payment transaction as seen by admins. */
export interface AdminPayment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  collaboration_id: string | null;
  invoice_id: string | null;
  brand_id: string | null;
  creator_id: string | null;
  fee_amount: number;
  creator_amount: number;
  created_at: string;
}

/** Filter options for listing payments. */
export interface AdminPaymentFilters {
  search?: string;
  status?: PaymentStatus;
  provider?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/** A dispute as seen by admins. */
export interface AdminDispute {
  id: string;
  collaboration_id: string;
  campaign_title: string | null;
  opened_by_name: string | null;
  status: DisputeStatus;
  reason: string;
  resolution: string | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Filter options for listing disputes. */
export interface AdminDisputeFilters {
  search?: string;
  status?: DisputeStatus;
  limit?: number;
  offset?: number;
}

/** A support ticket as seen by admins. */
export interface AdminSupportTicket {
  id: string;
  profile_id: string;
  user_name: string | null;
  user_email: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

/** Filter options for listing support tickets. */
export interface AdminSupportTicketFilters {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string;
  limit?: number;
  offset?: number;
}

/** A moderation report as seen by admins. */
export interface AdminModerationReport {
  id: string;
  reporter_name: string | null;
  reported_profile_name: string | null;
  reported_resource_type: string | null;
  reported_resource_id: string | null;
  reason: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

/** Filter options for listing moderation reports. */
export interface AdminModerationReportFilters {
  search?: string;
  status?: ReportStatus;
  limit?: number;
  offset?: number;
}

/** A system notification / announcement. */
export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  target_role: string | null;
  created_at: string;
  expires_at: string | null;
}

/** Input for creating / updating an announcement. */
export interface AnnouncementInput {
  title: string;
  body: string;
  target_role: string | null;
  expires_at: string | null;
}

/** Platform settings key-value. */
export interface AdminPlatformSetting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  category: string;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
}

/** Input for updating a platform setting. */
export interface PlatformSettingInput {
  setting_key: string;
  setting_value: unknown;
  category: string;
  is_public?: boolean;
}

/** An admin activity log entry. */
export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_name: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Filter options for listing activity logs. */
export interface AdminActivityLogFilters {
  admin_id?: string;
  action?: string;
  target_type?: string;
  limit?: number;
  offset?: number;
}

/** A generic paged list response. */
export interface PagedList<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/** Key metrics for the platform overview dashboard. */
export interface PlatformOverviewMetrics {
  total_users: number;
  total_brands: number;
  total_creators: number;
  total_campaigns: number;
  total_collaborations: number;
  total_payments_volume: number;
  pending_verifications: number;
  open_disputes: number;
  open_support_tickets: number;
  active_users_today: number;
  revenue_this_month: number;
  revenue_last_month: number;
  growth_percentage: number;
}

/** Time-series metric point. */
export interface MetricPoint {
  date: string;
  value: number;
}

/** Time-series data for charts. */
export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
}

// ---------------------------------------------------------------------------
// API contract types (shared between web route handlers and mobile client)
// ---------------------------------------------------------------------------

/** Standard API response envelope. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string | null;
    message: string | null;
  } | null;
  meta: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  } | null;
}

/** Standard API error. */
export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

// ---------------------------------------------------------------------------
// Mobile-specific types (for Expo/React Native future use)
// ---------------------------------------------------------------------------

/** Push notification subscription (mobile). */
export interface MobilePushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Offline action queue entry (mobile PWA / RN). */
export interface OfflineAction {
  id: string;
  action: "create" | "update" | "delete";
  resource: string;
  payload: unknown;
  created_at: string;
  retries: number;
}

/** Connection status for mobile / PWA. */
export type ConnectionStatus = "online" | "offline" | "unknown";
