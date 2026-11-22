/**
 * CALLBACX TECHNOLOGY — Error handling utilities
 *
 * Standardized error types and helpers for the service layer.
 * All service errors implement ServiceError so callers can handle them
 * consistently (client-side UI maps statusCode to HTTP, message to user text).
 */

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export interface ServiceError {
  code: string;            // machine-readable error code (e.g. "AUTH_INVALID_CREDENTIALS")
  message: string;         // human-readable message safe to show to users
  statusCode: number;      // HTTP status code for API route handlers
  details?: Record<string, unknown>;
  original?: Error;        // underlying error (never logged to client)
}

export interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function serviceError({
  code,
  message,
  statusCode = 400,
  details,
  original,
}: {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  original?: Error;
}): ServiceError {
  return {
    code,
    message,
    statusCode,
    details,
    original,
  };
}

// ---------------------------------------------------------------------------
// Predefined errors
// ---------------------------------------------------------------------------

export const Errors = {
  // Auth
  authInvalidCredentials: (): ServiceError =>
    serviceError({
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid email or password.",
      statusCode: 401,
    }),

  authEmailUnverified: (): ServiceError =>
    serviceError({
      code: "AUTH_EMAIL_UNVERIFIED",
      message: "Please verify your email before signing in.",
      statusCode: 403,
    }),

  authUserNotFound: (): ServiceError =>
    serviceError({
      code: "AUTH_USER_NOT_FOUND",
      message: "No account found with this email address.",
      statusCode: 404,
    }),

  authEmailExists: (): ServiceError =>
    serviceError({
      code: "AUTH_EMAIL_EXISTS",
      message: "An account with this email already exists.",
      statusCode: 409,
    }),

  authWeakPassword: (): ServiceError =>
    serviceError({
      code: "AUTH_WEAK_PASSWORD",
      message: "Password does not meet strength requirements.",
      statusCode: 400,
    }),

  authSessionRequired: (): ServiceError =>
    serviceError({
      code: "AUTH_SESSION_REQUIRED",
      message: "You must be signed in to perform this action.",
      statusCode: 401,
    }),

  authEmailAlreadyConfirmed: (): ServiceError =>
    serviceError({
      code: "AUTH_EMAIL_ALREADY_CONFIRMED",
      message: "Email is already confirmed.",
      statusCode: 400,
    }),

  // Profile
  profileNotFound: (): ServiceError =>
    serviceError({
      code: "PROFILE_NOT_FOUND",
      message: "Profile not found.",
      statusCode: 404,
    }),

  profileNotOwner: (): ServiceError =>
    serviceError({
      code: "PROFILE_NOT_OWNER",
      message: "You can only manage your own profile.",
      statusCode: 403,
    }),

  // Brand
  brandNotFound: (): ServiceError =>
    serviceError({
      code: "BRAND_NOT_FOUND",
      message: "Brand not found.",
      statusCode: 404,
    }),

  brandNotOwner: (): ServiceError =>
    serviceError({
      code: "BRAND_NOT_OWNER",
      message: "You do not own this brand.",
      statusCode: 403,
    }),

  brandNotMember: (): ServiceError =>
    serviceError({
      code: "BRAND_NOT_MEMBER",
      message: "You are not a member of this brand.",
      statusCode: 403,
    }),

  brandAlreadyExists: (): ServiceError =>
    serviceError({
      code: "BRAND_ALREADY_EXISTS",
      message: "A brand with this name already exists.",
      statusCode: 409,
    }),

  // Creator
  creatorProfileNotFound: (): ServiceError =>
    serviceError({
      code: "CREATOR_PROFILE_NOT_FOUND",
      message: "Creator profile not found.",
      statusCode: 404,
    }),

  creatorProfileNotOwner: (): ServiceError =>
    serviceError({
      code: "CREATOR_PROFILE_NOT_OWNER",
      message: "You can only manage your own creator profile.",
      statusCode: 403,
    }),

  creatorDuplicateSocialAccount: (): ServiceError =>
    serviceError({
      code: "CREATOR_DUPLICATE_SOCIAL_ACCOUNT",
      message: "This social account is already connected.",
      statusCode: 409,
    }),

  // Campaign
  campaignNotFound: (): ServiceError =>
    serviceError({
      code: "CAMPAIGN_NOT_FOUND",
      message: "Campaign not found.",
      statusCode: 404,
    }),

  campaignNotBrandMember: (): ServiceError =>
    serviceError({
      code: "CAMPAIGN_NOT_BRAND_MEMBER",
      message: "You are not a member of the brand that owns this campaign.",
      statusCode: 403,
    }),

  campaignInvalidStatusTransition: (from: string, to: string): ServiceError =>
    serviceError({
      code: "CAMPAIGN_INVALID_STATUS_TRANSITION",
      message: `Cannot transition campaign from "${from}" to "${to}".`,
      statusCode: 400,
    }),

  campaignAlreadyPublished: (): ServiceError =>
    serviceError({
      code: "CAMPAIGN_ALREADY_PUBLISHED",
      message: "Campaign is already published.",
      statusCode: 400,
    }),

  // Application
  applicationNotFound: (): ServiceError =>
    serviceError({
      code: "APPLICATION_NOT_FOUND",
      message: "Application not found.",
      statusCode: 404,
    }),

  applicationDuplicate: (): ServiceError =>
    serviceError({
      code: "APPLICATION_DUPLICATE",
      message: "You have already applied to this campaign.",
      statusCode: 409,
    }),

  applicationNotApplicant: (): ServiceError =>
    serviceError({
      code: "APPLICATION_NOT_APPLICANT",
      message: "Only the applicant can withdraw or edit this application.",
      statusCode: 403,
    }),

  applicationInvalidStatusTransition: (from: string, to: string): ServiceError =>
    serviceError({
      code: "APPLICATION_INVALID_STATUS_TRANSITION",
      message: `Cannot transition application from "${from}" to "${to}".`,
      statusCode: 400,
    }),

  // Collaboration
  collaborationNotFound: (): ServiceError =>
    serviceError({
      code: "COLLABORATION_NOT_FOUND",
      message: "Collaboration not found.",
      statusCode: 404,
    }),

  collaborationNotParticipant: (): ServiceError =>
    serviceError({
      code: "COLLABORATION_NOT_PARTICIPANT",
      message: "You are not a participant in this collaboration.",
      statusCode: 403,
    }),

  collaborationInvalidStatusTransition: (from: string, to: string): ServiceError =>
    serviceError({
      code: "COLLABORATION_INVALID_STATUS_TRANSITION",
      message: `Cannot transition collaboration from "${from}" to "${to}".`,
      statusCode: 400,
    }),

  invitationNotFound: (): ServiceError =>
    serviceError({
      code: "INVITATION_NOT_FOUND",
      message: "Invitation not found.",
      statusCode: 404,
    }),

  invitationExpired: (): ServiceError =>
    serviceError({
      code: "INVITATION_EXPIRED",
      message: "Invitation has expired.",
      statusCode: 410,
    }),

  invitationAlreadyResponded: (): ServiceError =>
    serviceError({
      code: "INVITATION_ALREADY_RESPONDED",
      message: "Invitation has already been responded to.",
      statusCode: 409,
    }),

  // Message
  messageNotFound: (): ServiceError =>
    serviceError({
      code: "MESSAGE_NOT_FOUND",
      message: "Message not found.",
      statusCode: 404,
    }),

  messageNotSender: (): ServiceError =>
    serviceError({
      code: "MESSAGE_NOT_SENDER",
      message: "You can only edit or delete your own messages.",
      statusCode: 403,
    }),

  conversationNotFound: (): ServiceError =>
    serviceError({
      code: "CONVERSATION_NOT_FOUND",
      message: "Conversation not found.",
      statusCode: 404,
    }),

  conversationNotParticipant: (): ServiceError =>
    serviceError({
      code: "CONVERSATION_NOT_PARTICIPANT",
      message: "You are not a participant in this conversation.",
      statusCode: 403,
    }),

  // Notification
  notificationNotFound: (): ServiceError =>
    serviceError({
      code: "NOTIFICATION_NOT_FOUND",
      message: "Notification not found.",
      statusCode: 404,
    }),

  notificationNotRecipient: (): ServiceError =>
    serviceError({
      code: "NOTIFICATION_NOT_RECIPIENT",
      message: "You can only manage your own notifications.",
      statusCode: 403,
    }),

  // Payment
  paymentNotFound: (): ServiceError =>
    serviceError({
      code: "PAYMENT_NOT_FOUND",
      message: "Payment not found.",
      statusCode: 404,
    }),

  paymentNotParty: (): ServiceError =>
    serviceError({
      code: "PAYMENT_NOT_PARTY",
      message: "You are not a party to this payment.",
      statusCode: 403,
    }),

  invoiceNotFound: (): ServiceError =>
    serviceError({
      code: "INVOICE_NOT_FOUND",
      message: "Invoice not found.",
      statusCode: 404,
    }),

  invoiceNotBrandOwner: (): ServiceError =>
    serviceError({
      code: "INVOICE_NOT_BRAND_OWNER",
      message: "Only the brand owner can manage invoices.",
      statusCode: 403,
    }),

  invoiceAlreadyPaid: (): ServiceError =>
    serviceError({
      code: "INVOICE_ALREADY_PAID",
      message: "Invoice is already paid.",
      statusCode: 400,
    }),

  refundNotFound: (): ServiceError =>
    serviceError({
      code: "REFUND_NOT_FOUND",
      message: "Refund not found.",
      statusCode: 404,
    }),

  refundNotStaff: (): ServiceError =>
    serviceError({
      code: "REFUND_NOT_STAFF",
      message: "Only platform staff can process refunds.",
      statusCode: 403,
    }),

  // Review
  reviewNotFound: (): ServiceError =>
    serviceError({
      code: "REVIEW_NOT_FOUND",
      message: "Review not found.",
      statusCode: 404,
    }),

  reviewNotReviewer: (): ServiceError =>
    serviceError({
      code: "REVIEW_NOT_REVIEWER",
      message: "Only the reviewer can edit this review.",
      statusCode: 403,
    }),

  reviewDuplicate: (): ServiceError =>
    serviceError({
      code: "REVIEW_DUPLICATE",
      message: "You have already reviewed this collaboration.",
      statusCode: 409,
    }),

  // Upload
  uploadInvalidFile: (): ServiceError =>
    serviceError({
      code: "UPLOAD_INVALID_FILE",
      message: "Invalid file or file type.",
      statusCode: 400,
    }),

  uploadFileTooLarge: (maxBytes: number): ServiceError =>
    serviceError({
      code: "UPLOAD_FILE_TOO_LARGE",
      message: `File exceeds the ${maxBytes / 1024 / 1024}MB size limit.`,
      statusCode: 400,
    }),

  uploadNotAuthorized: (): ServiceError =>
    serviceError({
      code: "UPLOAD_NOT_AUTHORIZED",
      message: "You are not authorized to upload to this bucket.",
      statusCode: 403,
    }),

  // Admin
  adminNotStaff: (): ServiceError =>
    serviceError({
      code: "ADMIN_NOT_STAFF",
      message: "Admin access required.",
      statusCode: 403,
    }),

  // Generic
  notFound: (resource = "Resource"): ServiceError =>
    serviceError({
      code: "NOT_FOUND",
      message: `${resource} not found.`,
      statusCode: 404,
    }),

  forbidden: (message = "You are not authorized to perform this action."): ServiceError =>
    serviceError({
      code: "FORBIDDEN",
      message,
      statusCode: 403,
    }),

  validationFailed: (message = "Validation failed.", details?: Record<string, unknown>): ServiceError =>
    serviceError({
      code: "VALIDATION_FAILED",
      message,
      statusCode: 400,
      details,
    }),

  internal: (message = "An internal error occurred.", original?: Error): ServiceError =>
    serviceError({
      code: "INTERNAL_ERROR",
      message,
      statusCode: 500,
      original,
    }),

  conflict: (message = "Resource conflict."): ServiceError =>
    serviceError({
      code: "CONFLICT",
      message,
      statusCode: 409,
    }),
} as const;

// ---------------------------------------------------------------------------
// Result helpers
// ---------------------------------------------------------------------------

export function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

export function fail<T>(error: ServiceError): ServiceResult<T> {
  return { data: null, error };
}

// ---------------------------------------------------------------------------
// Supabase error mapper
// ---------------------------------------------------------------------------

/**
 * Map a Supabase/Postgres error to a ServiceError.
 * Never leak raw database details to the client.
 */
export function mapSupabaseError(error: unknown): ServiceError {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code);
    const message = (error as { message?: string }).message || "Database error";

    switch (code) {
      case "23505": // unique_violation
        return Errors.conflict(message);
      case "23503": // foreign_key_violation
        return Errors.notFound("Referenced record");
      case "23514": // check_violation
        return Errors.validationFailed(message);
      case "42501": // insufficient_privilege (RLS or trigger)
        return Errors.forbidden();
      case "PGRST116": // no rows returned by .single()
        return Errors.notFound();
      case "23P01": // exclusion_violation
        return Errors.conflict(message);
      default:
        return Errors.internal(message);
    }
  }

  return Errors.internal(String(error));
}

// ---------------------------------------------------------------------------
// API route handler wrapper
// ---------------------------------------------------------------------------

/**
 * Wrap an API route handler so all service errors are converted to
 * standardized JSON responses. Unexpected errors are caught and
 * returned as 500 without leaking internals.
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      const serviceError =
        error && typeof error === "object" && "code" in error && "statusCode" in error
          ? (error as ServiceError)
          : mapSupabaseError(error);

      const body = {
        error: {
          code: serviceError.code,
          message: serviceError.message,
          ...(serviceError.details ? { details: serviceError.details } : {}),
        },
      };

      // Log internals server-side only
      if (serviceError.statusCode >= 500 || serviceError.original) {
        console.error("[API ERROR]", serviceError.code, serviceError.original || serviceError.message);
      }

      return Response.json(body, { status: serviceError.statusCode });
    }
  };
}
