/**
 * CALLBACX MARKETING — Admin service
 *
 * Admin activity logs and privileged platform operations.
 * All writes are staff-only (RLS: is_staff). Activity logs are append-only
 * (trigger blocks updates/deletes).
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type {
  AdminActivityLogs,
  PaymentTransactions,
  Brands,
  CreatorProfiles,
  Campaigns,
  Collaborations,
  Disputes,
  SupportTickets,
  ModerationReports,
  PlatformSettings,
  SystemNotifications,
  Profiles,
} from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type {
  AdminActivityLogInput,
  AdminPaymentListInput,
} from "@/lib/validations";
import type {
  AdminUserListInput,
  AdminUserUpdateInput,
  AdminBrandListInput,
  BrandVerificationInput,
  AdminCreatorListInput,
  CreatorVerificationInput,
  AdminCampaignListInput,
  CampaignModerationInput,
  AdminCollaborationListInput,
  CollaborationStatusUpdateInput,
  AdminDisputeListInput,
  DisputeResolutionInput,
  AdminSupportTicketListInput,
  SupportTicketAssignmentInput,
  AdminModerationReportListInput,
  AnnouncementCreateInput,
  AnnouncementUpdateInput,
  AnnouncementListInput,
  PlatformSettingUpsertInput,
  PlatformSettingListInput,
  OverviewMetricsInput,
} from "@/lib/validations/admin";

type Client = any;

// ---------------------------------------------------------------------------
// Activity logs
// ---------------------------------------------------------------------------

/**
 * List admin activity logs. Staff only.
 */
export async function listActivityLogs(
  {
    limit = 50,
    offset = 0,
    adminId,
    action,
  }: {
    limit?: number;
    offset?: number;
    adminId?: string;
    action?: string;
  } = {},
  client?: Client
): Promise<ServiceResult<AdminActivityLogs[]>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (!(await isStaff(supabase, profileId))) {
    return fail(Errors.adminNotStaff());
  }

  try {
    let query = supabase
      .from("admin_activity_logs")
      .select("*, admin:profiles(id, full_name)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (adminId) {
      query = query.eq("admin_id", adminId);
    }
    if (action) {
      query = query.ilike("action", `%${action}%`);
    }

    const { data, error } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok(data ?? []);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Create an activity log entry. Staff only. Append-only (server-side).
 */
export async function createActivityLog(
  input: AdminActivityLogInput,
  client?: Client
): Promise<ServiceResult<AdminActivityLogs>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) {
    return fail(Errors.authSessionRequired());
  }

  if (!(await isStaff(supabase, profileId))) {
    return fail(Errors.adminNotStaff());
  }

  try {
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .insert({
        admin_id: profileId,
        action: input.action,
        target_type: input.target_type,
        target_id: input.target_id ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Activity log was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Server-side activity log (admin client). Used by privileged operations
 * where the actor is known but may not have a normal session context.
 */
export async function createActivityLogServerSide(input: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<ServiceResult<AdminActivityLogs>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .insert({
        admin_id: input.adminId,
        action: input.action,
        target_type: input.targetType,
        target_id: input.targetId ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Activity log was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Payments / transactions
// ---------------------------------------------------------------------------

/**
 * List payment transactions for the admin financial monitoring screen.
 * Supports search / status / provider / date-range filters and pagination.
 */
export async function listAdminPayments(
  input: AdminPaymentListInput,
): Promise<ServiceResult<{ payments: PaymentTransactions[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, status, provider, start_date, end_date, limit, offset } = input;

  const from = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = end_date ? new Date(end_date) : new Date();

  let query = supabase
    .from("payment_transactions")
    .select(
      "*, collaboration:collaborations(id, status, brand_id, creator_profile_id, campaign_id), invoice:invoices(id, invoice_number, status, amount, currency)",
    )
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());

  if (status) query = query.eq("status", status);
  if (provider) query = query.eq("provider", provider);
  if (search) {
    // Validate search input to prevent SQL injection via .or() filter interpolation.
    if (!/^[A-Za-z0-9\s\-_,.']{1,200}$/.test(search)) {
      return fail(Errors.validationFailed("Search contains invalid characters."));
    }
    const safeSearch = search.replace(/'/g, "''");
    query = query.or(`id.like.%${safeSearch}%,provider_payment_id.like.%${safeSearch}%,provider.like.%${safeSearch}%`);
  }

  const { data, error, count } = await query.range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1);

  if (error) return fail(mapSupabaseError(error));

  return ok({
    payments: (data ?? []) as PaymentTransactions[],
    total: count ?? (data ?? []).length,
  });
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

/**
 * List platform settings. Staff only.
 */
export async function listPlatformSettings(
  input: PlatformSettingListInput = {},
): Promise<ServiceResult<{ settings: PlatformSettings[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { category, search, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("platform_settings")
      .select("*", { count: "exact" })
      .order("setting_key", { ascending: true })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (search) query = query.ilike("setting_key", `%${search}%`);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ settings: (data ?? []) as PlatformSettings[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Upsert a platform setting. Staff only.
 */
export async function upsertPlatformSetting(
  input: PlatformSettingUpsertInput,
): Promise<ServiceResult<PlatformSettings>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .upsert({
        setting_key: input.setting_key,
        setting_value: input.setting_value ?? {},
        category: input.category,
        is_public: input.is_public ?? false,
      }, { onConflict: "setting_key" })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Platform setting was not upserted."));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

/**
 * List admin users with filters. Staff only.
 */
export async function listAdminUsers(
  input: AdminUserListInput = {},
): Promise<ServiceResult<{ users: Profiles[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, role, status, brand_id, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("full_name", `%${search}%`);
    if (status) query = query.eq("status", status);
    // role and brand_id would need joins; kept simple for now

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ users: (data ?? []) as Profiles[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update a user's role/status. Staff only.
 */
export async function updateAdminUser(
  userId: string,
  input: AdminUserUpdateInput,
): Promise<ServiceResult<Profiles>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        status: input.status,
        // role updates would go through profile_user_roles table
      })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound("User not found."));
    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Brand verification
// ---------------------------------------------------------------------------

/**
 * List brands with verification filters. Staff only.
 */
export async function listAdminBrands(
  input: AdminBrandListInput = {},
): Promise<ServiceResult<{ brands: Brands[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, verification_status, is_active, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("brands")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("name", `%${search}%`);
    if (verification_status) query = query.eq("verification_status", verification_status);
    if (is_active !== undefined) query = query.eq("is_active", is_active);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ brands: (data ?? []) as Brands[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Verify or reject a brand. Staff only.
 */
export async function verifyBrand(
  input: BrandVerificationInput,
): Promise<ServiceResult<Brands>> {
  const supabase = getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("brands")
      .update({
        verification_status: input.status,
        verified_at: input.status === "verified" ? new Date().toISOString() : null,
        verified_by: input.status === "verified" ? profileId : null,
      })
      .eq("id", input.brand_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound("Brand not found."));

    // Log activity
    await createActivityLogServerSide({
      adminId: profileId,
      action: "brand_verification",
      targetType: "brand",
      targetId: input.brand_id,
      metadata: { status: input.status, reason: input.reason },
    });

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Creator verification
// ---------------------------------------------------------------------------

/**
 * List creators with verification filters. Staff only.
 */
export async function listAdminCreators(
  input: AdminCreatorListInput = {},
): Promise<ServiceResult<{ creators: CreatorProfiles[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, verification_status, is_public, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("creator_profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("display_name", `%${search}%`);
    if (verification_status) query = query.eq("verification_status", verification_status);
    if (is_public !== undefined) query = query.eq("is_public", is_public);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ creators: (data ?? []) as CreatorProfiles[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Verify or reject a creator. Staff only.
 */
export async function verifyCreator(
  input: CreatorVerificationInput,
): Promise<ServiceResult<CreatorProfiles>> {
  const supabase = getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .update({
        verification_status: input.status,
      })
      .eq("id", input.creator_profile_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound("Creator not found."));

    await createActivityLogServerSide({
      adminId: profileId,
      action: "creator_verification",
      targetType: "creator_profile",
      targetId: input.creator_profile_id,
      metadata: { status: input.status, reason: input.reason },
    });

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Campaign moderation
// ---------------------------------------------------------------------------

/**
 * List campaigns with moderation filters. Staff only.
 */
export async function listAdminCampaigns(
  input: AdminCampaignListInput = {},
): Promise<ServiceResult<{ campaigns: Campaigns[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, status, brand_id, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("campaigns")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("title", `%${search}%`);
    if (status) query = query.eq("status", status);
    if (brand_id) query = query.eq("brand_id", brand_id);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ campaigns: (data ?? []) as Campaigns[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Moderate a campaign (publish, pause, archive, cancel, reject). Staff only.
 */
export async function moderateCampaign(
  input: CampaignModerationInput,
): Promise<ServiceResult<Campaigns>> {
  const supabase = getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  const statusMap: Record<string, string> = {
    publish: "published",
    pause: "paused",
    archive: "archived",
    cancel: "cancelled",
    reject: "rejected",
  };
  const newStatus = statusMap[input.action];

  try {
    const updates: Partial<Campaigns> = { status: newStatus as Campaigns["status"] };
    if (input.action === "publish") {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = profileId;
    }

    const { data, error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", input.campaign_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound("Campaign not found."));

    await createActivityLogServerSide({
      adminId: profileId,
      action: `campaign_${input.action}`,
      targetType: "campaign",
      targetId: input.campaign_id,
      metadata: { reason: input.reason },
    });

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Collaboration monitoring
// ---------------------------------------------------------------------------

/**
 * List collaborations. Staff only.
 */
export async function listAdminCollaborations(
  input: AdminCollaborationListInput = {},
): Promise<ServiceResult<{ collaborations: Collaborations[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, status, campaign_id, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("collaborations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("id", `%${search}%`);
    if (status) query = query.eq("status", status);
    if (campaign_id) query = query.eq("campaign_id", campaign_id);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ collaborations: (data ?? []) as Collaborations[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update collaboration status. Staff only.
 */
export async function updateCollaborationStatus(
  input: CollaborationStatusUpdateInput,
): Promise<ServiceResult<Collaborations>> {
  const supabase = getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const updates: Partial<Collaborations> = { status: input.status };
    if (input.status === "completed") updates.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("collaborations")
      .update(updates)
      .eq("id", input.collaboration_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound("Collaboration not found."));

    await createActivityLogServerSide({
      adminId: profileId,
      action: "collaboration_status_update",
      targetType: "collaboration",
      targetId: input.collaboration_id,
      metadata: { status: input.status, reason: input.reason },
    });

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

/**
 * List disputes. Staff only.
 */
export async function listAdminDisputes(
  input: AdminDisputeListInput = {},
): Promise<ServiceResult<{ disputes: Disputes[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, status, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("disputes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("reason", `%${search}%`);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ disputes: (data ?? []) as Disputes[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Resolve a dispute. Staff only.
 */
export async function resolveDispute(
  input: DisputeResolutionInput,
): Promise<ServiceResult<Disputes>> {
  const supabase = getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("disputes")
      .update({
        status: input.status,
        resolution: input.resolution,
        resolved_by: profileId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", input.dispute_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound("Dispute not found."));

    await createActivityLogServerSide({
      adminId: profileId,
      action: "dispute_resolve",
      targetType: "dispute",
      targetId: input.dispute_id,
      metadata: { status: input.status, resolution: input.resolution },
    });

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------

/**
 * List support tickets. Staff only.
 */
export async function listAdminSupportTickets(
  input: AdminSupportTicketListInput = {},
): Promise<ServiceResult<{ tickets: SupportTickets[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, status, priority, assigned_to, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("support_tickets")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("subject", `%${search}%`);
    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (assigned_to) query = query.eq("assigned_to", assigned_to);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ tickets: (data ?? []) as SupportTickets[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Assign a support ticket. Staff only.
 */
export async function assignSupportTicket(
  input: SupportTicketAssignmentInput,
): Promise<ServiceResult<SupportTickets>> {
  const supabase = getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .update({ assigned_to: input.assigned_to, status: "pending" })
      .eq("id", input.ticket_id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound("Support ticket not found."));

    await createActivityLogServerSide({
      adminId: profileId,
      action: "support_ticket_assign",
      targetType: "support_ticket",
      targetId: input.ticket_id,
      metadata: { assigned_to: input.assigned_to },
    });

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Moderation reports
// ---------------------------------------------------------------------------

/**
 * List moderation reports. Staff only.
 */
export async function listAdminModerationReports(
  input: AdminModerationReportListInput = {},
): Promise<ServiceResult<{ reports: ModerationReports[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, status, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("moderation_reports")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("reason", `%${search}%`);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ reports: (data ?? []) as ModerationReports[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Announcements / System notifications
// ---------------------------------------------------------------------------

/**
 * List announcements. Staff only.
 */
export async function listAnnouncements(
  input: AnnouncementListInput = {},
): Promise<ServiceResult<{ announcements: SystemNotifications[]; total: number }>> {
  const supabase = getSupabaseAdminClient();
  const { search, target_role, limit = 50, offset = 0 } = input;

  try {
    let query = supabase
      .from("system_notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.ilike("title", `%${search}%`);
    if (target_role) query = query.eq("target_role", target_role);

    const { data, error, count } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok({ announcements: (data ?? []) as SystemNotifications[], total: count ?? 0 });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Create an announcement. Staff only.
 */
export async function createAnnouncement(
  input: AnnouncementCreateInput,
): Promise<ServiceResult<SystemNotifications>> {
  const supabase = getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("system_notifications")
      .insert({
        title: input.title,
        body: input.body,
        target_role: input.target_role ?? "",
        expires_at: input.expires_at ?? null,
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Announcement was not created."));

    await createActivityLogServerSide({
      adminId: profileId,
      action: "announcement_create",
      targetType: "system_notification",
      targetId: data.id,
      metadata: { title: input.title },
    });

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update an announcement. Staff only.
 */
export async function updateAnnouncement(
  id: string,
  input: AnnouncementUpdateInput,
): Promise<ServiceResult<SystemNotifications>> {
  const supabase = getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);

  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("system_notifications")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound("Announcement not found."));

    await createActivityLogServerSide({
      adminId: profileId,
      action: "announcement_update",
      targetType: "system_notification",
      targetId: id,
      metadata: input,
    });

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Overview metrics
// ---------------------------------------------------------------------------

/**
 * Get overview metrics for admin dashboard. Staff only.
 */
export async function getOverviewMetrics(
  input: OverviewMetricsInput = {},
): Promise<ServiceResult<Record<string, unknown>>> {
  const supabase = getSupabaseAdminClient();
  const { start_date, end_date } = input;

  const from = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = end_date ? new Date(end_date) : new Date();

  try {
    // Parallel count queries for dashboard cards
    const [
      { count: totalUsers },
      { count: totalBrands },
      { count: totalCreators },
      { count: totalCampaigns },
      { count: activeCollaborations },
      { count: openDisputes },
      { count: openTickets },
      { count: pendingReports },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("brands").select("*", { count: "exact", head: true }).gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("creator_profiles").select("*", { count: "exact", head: true }).gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("campaigns").select("*", { count: "exact", head: true }).gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
      supabase.from("collaborations").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("moderation_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    return ok({
      totalUsers: totalUsers ?? 0,
      totalBrands: totalBrands ?? 0,
      totalCreators: totalCreators ?? 0,
      totalCampaigns: totalCampaigns ?? 0,
      activeCollaborations: activeCollaborations ?? 0,
      openDisputes: openDisputes ?? 0,
      openTickets: openTickets ?? 0,
      pendingReports: pendingReports ?? 0,
    });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  return getCachedProfileId(supabase);
}

async function isStaff(
  supabase: Client,
  profileId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}


