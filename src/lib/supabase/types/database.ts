/**
 * CALLBACX TECHNOLOGY â€” Database types
 *
 * Hand-maintained mirror of the public schema defined in
 * supabase/migrations/0001..0014. This is the canonical type used by all
 * service-layer code.
 *
 * When the schema changes, regenerate the authoritative types with:
 *   npx supabase gen types typescript --linked > src/lib/supabase/types/database.ts
 * and then re-apply the helper aliases below (Row/Insert/Update).
 *
 * If you keep this file as the source of truth, update it manually together
 * with the migration that changes the schema.
 */

// ---------------------------------------------------------------------------
// Enums (mirror of public.<enum>)
// ---------------------------------------------------------------------------

export type AccountStatus = "active" | "suspended" | "banned" | "deleted";
export type VerificationStatus = "pending" | "verified" | "rejected" | "expired";
export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "paused"
  | "completed"
  | "archived"
  | "cancelled";
export type CollaborationStatus =
  | "negotiating"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "disputed";
export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "accepted"
  | "rejected"
  | "withdrawn";
export type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "revoked";
export type DeliverableStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "revision_requested"
  | "rejected";
export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "cancelled";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "voided";
export type PayoutStatus = "pending" | "paid" | "failed" | "cancelled";
export type RefundStatus = "pending" | "approved" | "rejected" | "processed";
export type DisputeStatus = "open" | "in_review" | "resolved" | "closed";
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";
export type ConversationType = "direct" | "group";
export type MessageType = "text" | "file" | "system";
export type MediaKind = "image" | "video" | "document";
export type CompensationModel =
  | "flat_fee"
  | "per_deliverable"
  | "performance"
  | "negotiable";
export type CampaignVisibility = "public" | "brand_only" | "invite_only";
export type MembershipRole =
  | "owner"
  | "admin"
  | "member"
  | "finance"
  | "viewer";

// ---------------------------------------------------------------------------
// Helper aliases (columns common to many tables)
// ---------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Row<T> = T;
export type Insert<T> = T;
export type Update<T> = Partial<T>;

// ---------------------------------------------------------------------------
// Identity & user management (migration 0002)
// ---------------------------------------------------------------------------

export interface Profiles {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  is_public: boolean;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProfilePrivate {
  id: string;
  profile_id: string;
  phone: string | null;
  date_of_birth: string | null;
  address: Json;
  id_document_url: string | null;
  updated_at: string;
}

export interface UserRoles {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_privileged: boolean;
  is_system: boolean;
  created_at: string;
}

export interface Permissions {
  id: string;
  name: string;
  slug: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface RolePermissions {
  role_id: string;
  permission_id: string;
  granted_at: string;
}

export interface ProfileUserRoles {
  profile_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

export interface UserPreferences {
  profile_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  newsletter: boolean;
  theme: string;
  language: string;
  updated_at: string;
}

export interface UserSessions {
  id: string;
  profile_id: string;
  user_agent: string | null;
  ip_address: string | null;
  last_active_at: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Brands (migration 0003)
// ---------------------------------------------------------------------------

export interface BrandCategories {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Brands {
  id: string;
  owner_id: string;
  name: string;
  legal_name: string | null;
  trade_name: string | null;
  description: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: Json;
  brand_category_id: string | null;
  logo_url: string | null;
  brand_kit: Json;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  is_active: boolean;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BrandMembers {
  id: string;
  brand_id: string;
  profile_id: string;
  role: MembershipRole;
  is_active: boolean;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface BrandInvitations {
  id: string;
  brand_id: string;
  email: string;
  role: MembershipRole;
  token: string;
  token_hash: string;
  invited_by: string;
  accepted_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  status: InvitationStatus;
  created_at: string;
}

export interface BrandVerifications {
  id: string;
  brand_id: string;
  document_type: string;
  document_url: string;
  status: VerificationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface BrandBillingProfiles {
  id: string;
  brand_id: string;
  company_name: string;
  tax_id: string;
  billing_email: string;
  address: Json;
  payment_provider: string;
  provider_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Creators (migration 0004)
// ---------------------------------------------------------------------------

export interface CreatorCategories {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface CreatorNiches {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface CreatorProfiles {
  id: string;
  profile_id: string;
  display_name: string;
  bio: string | null;
  location: Json;
  languages: string[];
  avatar_url: string | null;
  cover_url: string | null;
  contact_email: string | null;
  website_url: string | null;
  availability_status: string;
  collaboration_preferences: Json;
  verification_status: VerificationStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreatorProfileCategories {
  creator_profile_id: string;
  creator_category_id: string;
}

export interface CreatorProfileNiches {
  creator_profile_id: string;
  creator_niche_id: string;
}

export interface CreatorSocialAccounts {
  id: string;
  creator_profile_id: string;
  platform: string;
  platform_user_id: string | null;
  username: string;
  profile_url: string | null;
  is_verified: boolean;
  followers_count: number | null;
  engagement_rate: number | null;
  metrics_source: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorPortfolios {
  id: string;
  creator_profile_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatorMedia {
  id: string;
  creator_profile_id: string;
  portfolio_id: string | null;
  storage_path: string;
  media_kind: MediaKind;
  title: string | null;
  caption: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface CreatorRates {
  id: string;
  creator_profile_id: string;
  service_type: string;
  min_rate: number;
  max_rate: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorAvailability {
  id: string;
  creator_profile_id: string;
  start_date: string;
  end_date: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface CreatorVerifications {
  id: string;
  creator_profile_id: string;
  document_type: string;
  document_url: string;
  status: VerificationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Campaigns (migration 0005)
// ---------------------------------------------------------------------------

export interface CampaignCategories {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface CampaignNiches {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Campaigns {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  brief: string | null;
  category_id: string | null;
  status: CampaignStatus;
  objective: string | null;
  target_audience: Json;
  budget_total: number;
  budget_currency: string;
  compensation_model: CompensationModel;
  payment_terms: string | null;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  location_requirements: Json;
  platform_requirements: string[];
  visibility: CampaignVisibility;
  approval_required: boolean;
  approved_at: string | null;
  approved_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CampaignCampaignNiches {
  campaign_id: string;
  campaign_niche_id: string;
}

export interface CampaignRequirements {
  id: string;
  campaign_id: string;
  requirement: string;
  is_mandatory: boolean;
  order_index: number;
}

export interface CampaignDeliverables {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  deliverable_type: string;
  platform: string;
  due_date: string | null;
  requirements: Json;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignMedia {
  id: string;
  campaign_id: string;
  storage_path: string;
  media_kind: MediaKind;
  title: string | null;
  alt_text: string | null;
  created_at: string;
}

export interface CampaignBudgetAllocations {
  id: string;
  campaign_id: string;
  allocation_type: string;
  amount: number;
  currency: string;
  description: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Applications & collaborations (migration 0006)
// ---------------------------------------------------------------------------

export interface CampaignApplications {
  id: string;
  campaign_id: string;
  creator_profile_id: string;
  cover_letter: string | null;
  proposed_rate: number | null;
  currency: string;
  status: ApplicationStatus;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export interface CollaborationInvitations {
  id: string;
  campaign_id: string;
  brand_id: string;
  creator_profile_id: string;
  invited_by: string;
  proposed_fee: number | null;
  currency: string;
  message: string | null;
  token: string;
  token_hash: string;
  status: InvitationStatus;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
}

export interface Collaborations {
  id: string;
  campaign_id: string;
  brand_id: string;
  creator_profile_id: string;
  status: CollaborationStatus;
  agreed_fee: number | null;
  currency: string;
  contract_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CollaborationDeliverables {
  id: string;
  collaboration_id: string;
  campaign_deliverable_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: DeliverableStatus;
  created_at: string;
  updated_at: string;
}

export interface DeliverableSubmissions {
  id: string;
  collaboration_deliverable_id: string;
  creator_profile_id: string;
  submission_url: string | null;
  storage_path: string | null;
  media_kind: MediaKind | null;
  notes: string | null;
  submitted_at: string;
}

export interface DeliverableReviews {
  id: string;
  deliverable_submission_id: string;
  reviewer_id: string;
  rating: number | null;
  feedback: string | null;
  status: DeliverableStatus;
  created_at: string;
  updated_at: string;
}

export interface CollaborationContracts {
  id: string;
  collaboration_id: string;
  storage_path: string;
  contract_type: string;
  signed_at: string | null;
  signed_by_brand: boolean;
  signed_by_creator: boolean;
  created_at: string;
}

export interface CollaborationStatusHistory {
  id: string;
  collaboration_id: string;
  from_status: CollaborationStatus | null;
  to_status: CollaborationStatus;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Messaging & notifications (migration 0007)
// ---------------------------------------------------------------------------

export interface Conversations {
  id: string;
  type: ConversationType;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipants {
  id: string;
  conversation_id: string;
  profile_id: string;
  joined_at: string;
  left_at: string | null;
  last_read_at: string | null;
  is_muted: boolean;
}

export interface Messages {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  message_type: MessageType;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface MessageAttachments {
  id: string;
  message_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface Notifications {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string | null;
  data: Json;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  profile_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  categories: Json;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Payments (migration 0008)
// ---------------------------------------------------------------------------

export interface PaymentTransactions {
  id: string;
  collaboration_id: string | null;
  invoice_id: string | null;
  provider: string;
  provider_payment_id: string | null;
  idempotency_key: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  fee_amount: number;
  creator_amount: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface Invoices {
  id: string;
  invoice_number: string;
  collaboration_id: string;
  brand_id: string;
  creator_profile_id: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  pdf_storage_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorPayouts {
  id: string;
  creator_profile_id: string;
  payment_transaction_id: string | null;
  amount: number;
  currency: string;
  status: PayoutStatus;
  provider_payout_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformFees {
  id: string;
  payment_transaction_id: string;
  amount: number;
  currency: string;
  rate: number;
  created_at: string;
}

export interface Refunds {
  id: string;
  payment_transaction_id: string;
  amount: number;
  currency: string;
  reason: string | null;
  status: RefundStatus;
  provider_refund_id: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export interface PaymentWebhookEvents {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload: Json;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Analytics (migration 0009)
// ---------------------------------------------------------------------------

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  metric_date: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  revenue: number;
  source: string;
  collected_at: string;
}

export interface CreatorAnalytics {
  id: string;
  creator_profile_id: string;
  metric_date: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  revenue: number;
  source: string;
  collected_at: string;
}

export interface SocialMetricsSnapshots {
  id: string;
  creator_social_account_id: string;
  followers_count: number | null;
  engagement_rate: number | null;
  snapshotted_at: string;
  source: string;
}

export interface ConversionEvents {
  id: string;
  campaign_id: string | null;
  collaboration_id: string | null;
  creator_profile_id: string | null;
  event_type: string;
  value: number | null;
  currency: string | null;
  occurred_at: string;
  source: string;
  metadata: Json;
  created_at: string;
}

export interface PlatformAnalytics {
  id: string;
  metric_date: string;
  metric_name: string;
  metric_value: number;
  metadata: Json;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Reputation, moderation & support (migration 0010)
// ---------------------------------------------------------------------------

export interface Reviews {
  id: string;
  collaboration_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewResponses {
  id: string;
  review_id: string;
  responder_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Disputes {
  id: string;
  collaboration_id: string;
  opened_by: string;
  status: DisputeStatus;
  reason: string;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTickets {
  id: string;
  profile_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessages {
  id: string;
  support_ticket_id: string;
  sender_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface ModerationReports {
  id: string;
  reporter_id: string;
  reported_profile_id: string | null;
  reported_resource_type: string | null;
  reported_resource_id: string | null;
  reason: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface ModerationActions {
  id: string;
  moderation_report_id: string | null;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: Json;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Administration & audit (migration 0011)
// ---------------------------------------------------------------------------

export interface AdminActivityLogs {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Json;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogs {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  setting_key: string;
  setting_value: Json;
  category: string;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface SystemNotifications {
  id: string;
  title: string;
  body: string;
  target_role: string;
  created_at: string;
  expires_at: string | null;
}

export interface FeatureFlags {
  id: string;
  flag_key: string;
  enabled: boolean;
  rollout_percentage: number;
  conditions: Json;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Database type map (used by supabase-js)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profiles; Insert: Partial<Profiles>; Update: Partial<Profiles> };
      profile_private: { Row: ProfilePrivate; Insert: Partial<ProfilePrivate>; Update: Partial<ProfilePrivate> };
      user_roles: { Row: UserRoles; Insert: Partial<UserRoles>; Update: Partial<UserRoles> };
      permissions: { Row: Permissions; Insert: Partial<Permissions>; Update: Partial<Permissions> };
      role_permissions: { Row: RolePermissions; Insert: Partial<RolePermissions>; Update: Partial<RolePermissions> };
      profile_user_roles: { Row: ProfileUserRoles; Insert: Partial<ProfileUserRoles>; Update: Partial<ProfileUserRoles> };
      user_preferences: { Row: UserPreferences; Insert: Partial<UserPreferences>; Update: Partial<UserPreferences> };
      user_sessions: { Row: UserSessions; Insert: Partial<UserSessions>; Update: Partial<UserSessions> };
      brand_categories: { Row: BrandCategories; Insert: Partial<BrandCategories>; Update: Partial<BrandCategories> };
      brands: { Row: Brands; Insert: Partial<Brands>; Update: Partial<Brands> };
      brand_members: { Row: BrandMembers; Insert: Partial<BrandMembers>; Update: Partial<BrandMembers> };
      brand_invitations: { Row: BrandInvitations; Insert: Partial<BrandInvitations>; Update: Partial<BrandInvitations> };
      brand_verifications: { Row: BrandVerifications; Insert: Partial<BrandVerifications>; Update: Partial<BrandVerifications> };
      brand_billing_profiles: { Row: BrandBillingProfiles; Insert: Partial<BrandBillingProfiles>; Update: Partial<BrandBillingProfiles> };
      creator_categories: { Row: CreatorCategories; Insert: Partial<CreatorCategories>; Update: Partial<CreatorCategories> };
      creator_niches: { Row: CreatorNiches; Insert: Partial<CreatorNiches>; Update: Partial<CreatorNiches> };
      creator_profiles: { Row: CreatorProfiles; Insert: Partial<CreatorProfiles>; Update: Partial<CreatorProfiles> };
      creator_profile_categories: { Row: CreatorProfileCategories; Insert: Partial<CreatorProfileCategories>; Update: Partial<CreatorProfileCategories> };
      creator_profile_niches: { Row: CreatorProfileNiches; Insert: Partial<CreatorProfileNiches>; Update: Partial<CreatorProfileNiches> };
      creator_social_accounts: { Row: CreatorSocialAccounts; Insert: Partial<CreatorSocialAccounts>; Update: Partial<CreatorSocialAccounts> };
      creator_portfolios: { Row: CreatorPortfolios; Insert: Partial<CreatorPortfolios>; Update: Partial<CreatorPortfolios> };
      creator_media: { Row: CreatorMedia; Insert: Partial<CreatorMedia>; Update: Partial<CreatorMedia> };
      creator_rates: { Row: CreatorRates; Insert: Partial<CreatorRates>; Update: Partial<CreatorRates> };
      creator_availability: { Row: CreatorAvailability; Insert: Partial<CreatorAvailability>; Update: Partial<CreatorAvailability> };
      creator_verifications: { Row: CreatorVerifications; Insert: Partial<CreatorVerifications>; Update: Partial<CreatorVerifications> };
      campaign_categories: { Row: CampaignCategories; Insert: Partial<CampaignCategories>; Update: Partial<CampaignCategories> };
      campaign_niches: { Row: CampaignNiches; Insert: Partial<CampaignNiches>; Update: Partial<CampaignNiches> };
      campaigns: { Row: Campaigns; Insert: Partial<Campaigns>; Update: Partial<Campaigns> };
      campaign_campaign_niches: { Row: CampaignCampaignNiches; Insert: Partial<CampaignCampaignNiches>; Update: Partial<CampaignCampaignNiches> };
      campaign_requirements: { Row: CampaignRequirements; Insert: Partial<CampaignRequirements>; Update: Partial<CampaignRequirements> };
      campaign_deliverables: { Row: CampaignDeliverables; Insert: Partial<CampaignDeliverables>; Update: Partial<CampaignDeliverables> };
      campaign_media: { Row: CampaignMedia; Insert: Partial<CampaignMedia>; Update: Partial<CampaignMedia> };
      campaign_budget_allocations: { Row: CampaignBudgetAllocations; Insert: Partial<CampaignBudgetAllocations>; Update: Partial<CampaignBudgetAllocations> };
      campaign_applications: { Row: CampaignApplications; Insert: Partial<CampaignApplications>; Update: Partial<CampaignApplications> };
      collaboration_invitations: { Row: CollaborationInvitations; Insert: Partial<CollaborationInvitations>; Update: Partial<CollaborationInvitations> };
      collaborations: { Row: Collaborations; Insert: Partial<Collaborations>; Update: Partial<Collaborations> };
      collaboration_deliverables: { Row: CollaborationDeliverables; Insert: Partial<CollaborationDeliverables>; Update: Partial<CollaborationDeliverables> };
      deliverable_submissions: { Row: DeliverableSubmissions; Insert: Partial<DeliverableSubmissions>; Update: Partial<DeliverableSubmissions> };
      deliverable_reviews: { Row: DeliverableReviews; Insert: Partial<DeliverableReviews>; Update: Partial<DeliverableReviews> };
      collaboration_contracts: { Row: CollaborationContracts; Insert: Partial<CollaborationContracts>; Update: Partial<CollaborationContracts> };
      collaboration_status_history: { Row: CollaborationStatusHistory; Insert: Partial<CollaborationStatusHistory>; Update: Partial<CollaborationStatusHistory> };
      conversations: { Row: Conversations; Insert: Partial<Conversations>; Update: Partial<Conversations> };
      conversation_participants: { Row: ConversationParticipants; Insert: Partial<ConversationParticipants>; Update: Partial<ConversationParticipants> };
      messages: { Row: Messages; Insert: Partial<Messages>; Update: Partial<Messages> };
      message_attachments: { Row: MessageAttachments; Insert: Partial<MessageAttachments>; Update: Partial<MessageAttachments> };
      notifications: { Row: Notifications; Insert: Partial<Notifications>; Update: Partial<Notifications> };
      notification_preferences: { Row: NotificationPreferences; Insert: Partial<NotificationPreferences>; Update: Partial<NotificationPreferences> };
      payment_transactions: { Row: PaymentTransactions; Insert: Partial<PaymentTransactions>; Update: Partial<PaymentTransactions> };
      invoices: { Row: Invoices; Insert: Partial<Invoices>; Update: Partial<Invoices> };
      creator_payouts: { Row: CreatorPayouts; Insert: Partial<CreatorPayouts>; Update: Partial<CreatorPayouts> };
      platform_fees: { Row: PlatformFees; Insert: Partial<PlatformFees>; Update: Partial<PlatformFees> };
      refunds: { Row: Refunds; Insert: Partial<Refunds>; Update: Partial<Refunds> };
      payment_webhook_events: { Row: PaymentWebhookEvents; Insert: Partial<PaymentWebhookEvents>; Update: Partial<PaymentWebhookEvents> };
      campaign_analytics: { Row: CampaignAnalytics; Insert: Partial<CampaignAnalytics>; Update: Partial<CampaignAnalytics> };
      creator_analytics: { Row: CreatorAnalytics; Insert: Partial<CreatorAnalytics>; Update: Partial<CreatorAnalytics> };
      social_metrics_snapshots: { Row: SocialMetricsSnapshots; Insert: Partial<SocialMetricsSnapshots>; Update: Partial<SocialMetricsSnapshots> };
      conversion_events: { Row: ConversionEvents; Insert: Partial<ConversionEvents>; Update: Partial<ConversionEvents> };
      platform_analytics: { Row: PlatformAnalytics; Insert: Partial<PlatformAnalytics>; Update: Partial<PlatformAnalytics> };
      reviews: { Row: Reviews; Insert: Partial<Reviews>; Update: Partial<Reviews> };
      review_responses: { Row: ReviewResponses; Insert: Partial<ReviewResponses>; Update: Partial<ReviewResponses> };
      disputes: { Row: Disputes; Insert: Partial<Disputes>; Update: Partial<Disputes> };
      support_tickets: { Row: SupportTickets; Insert: Partial<SupportTickets>; Update: Partial<SupportTickets> };
      support_ticket_messages: { Row: SupportTicketMessages; Insert: Partial<SupportTicketMessages>; Update: Partial<SupportTicketMessages> };
      moderation_reports: { Row: ModerationReports; Insert: Partial<ModerationReports>; Update: Partial<ModerationReports> };
      moderation_actions: { Row: ModerationActions; Insert: Partial<ModerationActions>; Update: Partial<ModerationActions> };
      admin_activity_logs: { Row: AdminActivityLogs; Insert: Partial<AdminActivityLogs>; Update: Partial<AdminActivityLogs> };
      audit_logs: { Row: AuditLogs; Insert: Partial<AuditLogs>; Update: Partial<AuditLogs> };
      platform_settings: { Row: PlatformSettings; Insert: Partial<PlatformSettings>; Update: Partial<PlatformSettings> };
      system_notifications: { Row: SystemNotifications; Insert: Partial<SystemNotifications>; Update: Partial<SystemNotifications> };
      feature_flags: { Row: FeatureFlags; Insert: Partial<FeatureFlags>; Update: Partial<FeatureFlags> };
    };
    Views: {};
    Functions: {
      current_profile_id: { Args: Record<string, never>; Returns: string };
      profile_role_slugs: { Args: { p_profile: string }; Returns: string[] };
      has_role: { Args: { p_profile: string; p_role: string }; Returns: boolean };
      has_any_role: { Args: { p_profile: string; p_roles: string[] }; Returns: boolean };
      is_brand_owner: { Args: { p_brand: string; p_profile: string }; Returns: boolean };
      is_brand_member: { Args: { p_brand: string; p_profile: string }; Returns: boolean };
      can_manage_brand: { Args: { p_brand: string; p_profile: string }; Returns: boolean };
      is_campaign_brand: { Args: { p_campaign: string; p_profile: string }; Returns: boolean };
      is_campaign_brand_member: { Args: { p_campaign: string; p_profile: string }; Returns: boolean };
      creator_profile_for_profile: { Args: { p_profile: string }; Returns: string };
      is_creator_profile_owner: { Args: { p_creator_profile: string; p_profile: string }; Returns: boolean };
      is_platform_admin: { Args: { p_profile: string }; Returns: boolean };
      is_moderator: { Args: { p_profile: string }; Returns: boolean };
      is_staff: { Args: { p_profile: string }; Returns: boolean };
      is_collaboration_participant: { Args: { p_collaboration: string; p_profile: string }; Returns: boolean };
      is_conversation_participant: { Args: { p_conversation: string; p_profile: string }; Returns: boolean };
      is_deliverable_submission_owner: { Args: { p_submission: string; p_profile: string }; Returns: boolean };
    };
    Enums: {
      account_status: AccountStatus;
      verification_status: VerificationStatus;
      campaign_status: CampaignStatus;
      collaboration_status: CollaborationStatus;
      application_status: ApplicationStatus;
      invitation_status: InvitationStatus;
      deliverable_status: DeliverableStatus;
      payment_status: PaymentStatus;
      invoice_status: InvoiceStatus;
      payout_status: PayoutStatus;
      refund_status: RefundStatus;
      dispute_status: DisputeStatus;
      ticket_status: TicketStatus;
      ticket_priority: TicketPriority;
      report_status: ReportStatus;
      conversation_type: ConversationType;
      message_type: MessageType;
      media_kind: MediaKind;
      compensation_model: CompensationModel;
      campaign_visibility: CampaignVisibility;
      membership_role: MembershipRole;
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience table-name type (for generic helpers)
// ---------------------------------------------------------------------------

export type TableName = keyof Database["public"]["Tables"];

export type RowFor<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type InsertFor<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type UpdateFor<T extends TableName> = Database["public"]["Tables"][T]["Update"];

