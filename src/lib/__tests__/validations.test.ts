/**
 * CALLBACX TECHNOLOGY — Unit tests for Zod validation schemas (src/lib/validations)
 *
 * Pure logic tests: input validation, sanitization, rejection of malicious input.
 * No database required.
 */

import { z } from "zod";
import {
  signupSchema,
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  emailVerificationSchema,
  profileUpdateSchema,
  brandCreateSchema,
  brandUpdateSchema,
  creatorProfileCreateSchema,
  creatorProfileUpdateSchema,
  creatorSocialAccountSchema,
  creatorRateSchema,
  campaignCreateSchema,
  campaignUpdateSchema,
  campaignApplicationSchema,
  applicationReviewSchema,
  collaborationInvitationSchema,
  collaborationInvitationResponseSchema,
  collaborationStatusUpdateSchema,
  messageSendSchema,
  conversationCreateSchema,
  notificationPreferenceSchema,
  invoiceCreateSchema,
  invoiceMarkPaidSchema,
  refundCreateSchema,
  checkoutCreateSchema,
  reviewCreateSchema,
  uploadPresignSchema,
  adminActivityLogSchema,
  listCreatorsSchema,
  matchingCriteriaSchema,
  collectionCreateSchema,
  favoriteToggleSchema,
  collectionItemSchema,
  parseZodError,
  password,
  email,
  uuid,
  AUDIENCE_SIZE_BOUNDS,
  type SignupInput,
  type CampaignCreateInput,
} from "@/lib/validations";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

describe("validation — primitives", () => {
  it("uuid accepts valid UUIDs", () => {
    expect(() => uuid.parse("550e8400-e29b-41d4-a716-446655440000")).not.toThrow();
  });

  it("uuid rejects invalid UUIDs", () => {
    expect(() => uuid.parse("not-a-uuid")).toThrow(z.ZodError);
    expect(() => uuid.parse("")).toThrow(z.ZodError);
  });

  it("email accepts valid emails", () => {
    expect(() => email.parse("user@example.com")).not.toThrow();
    expect(() => email.parse("a@b.co")).not.toThrow();
  });

  it("email rejects invalid emails", () => {
    expect(() => email.parse("notanemail")).toThrow(z.ZodError);
    expect(() => email.parse("@example.com")).toThrow(z.ZodError);
    expect(() => email.parse("")).toThrow(z.ZodError);
  });

  it("password enforces complexity rules", () => {
    const valid = "Str0ng!Pass";
    expect(() => password.parse(valid)).not.toThrow();

    // Too short
    expect(() => password.parse("Short1!")).toThrow(z.ZodError);
    // No uppercase
    expect(() => password.parse("lowercase1!")).toThrow(z.ZodError);
    // No lowercase
    expect(() => password.parse("UPPERCASE1!")).toThrow(z.ZodError);
    // No number
    expect(() => password.parse("NoNumber!")).toThrow(z.ZodError);
    // No special char
    expect(() => password.parse("NoSpecial1")).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

describe("validation — auth schemas", () => {
  it("signupSchema accepts valid input", () => {
    const input: SignupInput = {
      email: "creator@example.com",
      password: "Str0ng!Pass",
      confirm_password: "Str0ng!Pass",
      full_name: "Jane Creator",
    };
    const result = signupSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("signupSchema rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      email: "a@b.com",
      password: "Str0ng!Pass",
      confirm_password: "Different!1",
      full_name: "Jane",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirm_password"))).toBe(true);
    }
  });

  it("signupSchema rejects weak password", () => {
    const result = signupSchema.safeParse({
      email: "a@b.com",
      password: "weak",
      confirm_password: "weak",
      full_name: "Jane",
    });
    expect(result.success).toBe(false);
  });

  it("signupSchema rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "Str0ng!Pass",
      confirm_password: "Str0ng!Pass",
      full_name: "Jane",
    });
    expect(result.success).toBe(false);
  });

  it("loginSchema accepts valid credentials", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "password123" })).not.toThrow();
  });

  it("loginSchema rejects missing password", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "" })).toThrow(z.ZodError);
  });

  it("resetPasswordSchema accepts email", () => {
    expect(() => resetPasswordSchema.parse({ email: "a@b.com" })).not.toThrow();
  });

  it("resetPasswordSchema rejects invalid email", () => {
    expect(() => resetPasswordSchema.parse({ email: "bad" })).toThrow(z.ZodError);
  });

  it("updatePasswordSchema enforces password complexity", () => {
    expect(() => updatePasswordSchema.parse({ new_password: "Str0ng!Pass" })).not.toThrow();
    expect(() => updatePasswordSchema.parse({ new_password: "weak" })).toThrow(z.ZodError);
  });

  it("emailVerificationSchema accepts valid token + type", () => {
    expect(() =>
      emailVerificationSchema.parse({ token_hash: "abc123", type: "signup" })
    ).not.toThrow();
    expect(() =>
      emailVerificationSchema.parse({ token_hash: "abc123", type: "recovery" })
    ).not.toThrow();
  });

  it("emailVerificationSchema rejects invalid type", () => {
    expect(() =>
      emailVerificationSchema.parse({ token_hash: "abc", type: "invalid" as any })
    ).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

describe("validation — brand schemas", () => {
  it("brandCreateSchema accepts valid input", () => {
    expect(() =>
      brandCreateSchema.parse({
        name: "Acme Corp",
        description: "A great brand",
        website_url: "https://acme.example.com",
        contact_email: "hello@acme.example.com",
        contact_phone: "+1-555-0100",
      })
    ).not.toThrow();
  });

  it("brandCreateSchema rejects missing name", () => {
    expect(() => brandCreateSchema.parse({ name: "" })).toThrow(z.ZodError);
  });

  it("brandCreateSchema rejects invalid URL", () => {
    expect(() =>
      brandCreateSchema.parse({ name: "Acme", website_url: "not-a-url" })
    ).toThrow(z.ZodError);
  });

  it("brandCreateSchema rejects invalid email", () => {
    expect(() =>
      brandCreateSchema.parse({ name: "Acme", contact_email: "not-an-email" })
    ).toThrow(z.ZodError);
  });

  it("brandUpdateSchema is partial (all optional)", () => {
    expect(() => brandUpdateSchema.parse({})).not.toThrow();
    expect(() => brandUpdateSchema.parse({ name: "New Name" })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Creator
// ---------------------------------------------------------------------------

describe("validation — creator schemas", () => {
  it("creatorProfileCreateSchema accepts valid input", () => {
    expect(() =>
      creatorProfileCreateSchema.parse({
        display_name: "Jane Creator",
        bio: "Fashion and lifestyle creator",
        languages: ["en", "es"],
        contact_email: "jane@example.com",
        website_url: "https://jane.example.com",
        availability_status: "open",
      })
    ).not.toThrow();
  });

  it("creatorProfileCreateSchema rejects invalid language codes", () => {
    expect(() =>
      creatorProfileCreateSchema.parse({
        display_name: "Jane",
        languages: ["english", "x"],
      })
    ).toThrow(z.ZodError);
  });

  it("creatorProfileUpdateSchema is partial", () => {
    expect(() => creatorProfileUpdateSchema.parse({})).not.toThrow();
  });

  it("creatorSocialAccountSchema accepts valid input", () => {
    expect(() =>
      creatorSocialAccountSchema.parse({
        platform: "instagram",
        username: "janedoe",
        profile_url: "https://instagram.com/janedoe",
        platform_user_id: "12345",
      })
    ).not.toThrow();
  });

  it("creatorSocialAccountSchema rejects missing platform/username", () => {
    expect(() =>
      creatorSocialAccountSchema.parse({ platform: "", username: "", profile_url: "https://example.com" })
    ).toThrow(z.ZodError);
  });

  it("creatorRateSchema enforces non-negative rates and 3-letter currency", () => {
    expect(() =>
      creatorRateSchema.parse({ service_type: "Sponsored Post", min_rate: 100, max_rate: 500, currency: "USD" })
    ).not.toThrow();
    expect(() =>
      creatorRateSchema.parse({ service_type: "X", min_rate: -10, max_rate: 500 })
    ).toThrow(z.ZodError);
    expect(() =>
      creatorRateSchema.parse({ service_type: "X", min_rate: 100, max_rate: 500, currency: "US" })
    ).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

describe("validation — campaign schemas", () => {
  const validCampaign: CampaignCreateInput = {
    title: "Summer Campaign 2026",
    description: "A summer influencer campaign",
    budget_total: 5000,
    budget_currency: "USD",
    compensation_model: "flat_fee",
    visibility: "public",
    approval_required: true,
  };

  it("campaignCreateSchema accepts valid input", () => {
    expect(() => campaignCreateSchema.parse(validCampaign)).not.toThrow();
  });

  it("campaignCreateSchema rejects missing title", () => {
    expect(() => campaignCreateSchema.parse({ ...validCampaign, title: "" })).toThrow(z.ZodError);
  });

  it("campaignCreateSchema rejects negative budget", () => {
    expect(() => campaignCreateSchema.parse({ ...validCampaign, budget_total: -100 })).toThrow(z.ZodError);
  });

  it("campaignCreateSchema rejects invalid currency", () => {
    expect(() =>
      campaignCreateSchema.parse({ ...validCampaign, budget_currency: "US" })
    ).toThrow(z.ZodError);
  });

  it("campaignCreateSchema rejects invalid visibility", () => {
    expect(() =>
      campaignCreateSchema.parse({ ...validCampaign, visibility: "everyone" as any })
    ).toThrow(z.ZodError);
  });

  it("campaignUpdateSchema is partial", () => {
    expect(() => campaignUpdateSchema.parse({})).not.toThrow();
    expect(() => campaignUpdateSchema.parse({ title: "New Title" })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

describe("validation — application schemas", () => {
  it("campaignApplicationSchema accepts valid input", () => {
    expect(() =>
      campaignApplicationSchema.parse({
        campaign_id: "550e8400-e29b-41d4-a716-446655440000",
        cover_letter: "I am a great fit",
        proposed_rate: 500,
        currency: "USD",
      })
    ).not.toThrow();
  });

  it("campaignApplicationSchema rejects invalid campaign_id", () => {
    expect(() =>
      campaignApplicationSchema.parse({ campaign_id: "not-a-uuid" })
    ).toThrow(z.ZodError);
  });

  it("campaignApplicationSchema rejects negative proposed_rate", () => {
    expect(() =>
      campaignApplicationSchema.parse({
        campaign_id: "550e8400-e29b-41d4-a716-446655440000",
        proposed_rate: -50,
      })
    ).toThrow(z.ZodError);
  });

  it("applicationReviewSchema accepts accept/reject/under_review", () => {
    expect(() =>
      applicationReviewSchema.parse({ application_id: "550e8400-e29b-41d4-a716-446655440000", status: "accepted" })
    ).not.toThrow();
    expect(() =>
      applicationReviewSchema.parse({ application_id: "550e8400-e29b-41d4-a716-446655440000", status: "rejected", rejection_reason: "Not a fit" })
    ).not.toThrow();
  });

  it("applicationReviewSchema rejects invalid status", () => {
    expect(() =>
      applicationReviewSchema.parse({ application_id: "550e8400-e29b-41d4-a716-446655440000", status: "approved" as any })
    ).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Collaboration
// ---------------------------------------------------------------------------

describe("validation — collaboration schemas", () => {
  it("collaborationInvitationSchema accepts valid input", () => {
    expect(() =>
      collaborationInvitationSchema.parse({
        campaign_id: "550e8400-e29b-41d4-a716-446655440000",
        creator_profile_id: "550e8400-e29b-41d4-a716-446655440001",
        proposed_fee: 1000,
        currency: "USD",
        message: "We would love to work with you",
        expires_at: "2026-12-31T23:59:59Z",
      })
    ).not.toThrow();
  });

  it("collaborationInvitationSchema rejects negative proposed_fee", () => {
    expect(() =>
      collaborationInvitationSchema.parse({
        campaign_id: "550e8400-e29b-41d4-a716-446655440000",
        creator_profile_id: "550e8400-e29b-41d4-a716-446655440001",
        proposed_fee: -100,
        expires_at: "2026-12-31",
      })
    ).toThrow(z.ZodError);
  });

  it("collaborationInvitationResponseSchema accepts accept/decline", () => {
    expect(() =>
      collaborationInvitationResponseSchema.parse({ invitation_id: "550e8400-e29b-41d4-a716-446655440000", accept: true })
    ).not.toThrow();
    expect(() =>
      collaborationInvitationResponseSchema.parse({ invitation_id: "550e8400-e29b-41d4-a716-446655440000", accept: false })
    ).not.toThrow();
  });

  it("collaborationStatusUpdateSchema accepts valid statuses", () => {
    ["negotiating", "active", "paused", "completed", "cancelled", "disputed"].forEach((status) => {
      expect(() =>
        collaborationStatusUpdateSchema.parse({ collaboration_id: "550e8400-e29b-41d4-a716-446655440000", status })
      ).not.toThrow();
    });
  });

  it("collaborationStatusUpdateSchema rejects invalid status", () => {
    expect(() =>
      collaborationStatusUpdateSchema.parse({ collaboration_id: "550e8400-e29b-41d4-a716-446655440000", status: "archived" as any })
    ).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

describe("validation — message schemas", () => {
  it("messageSendSchema accepts valid input", () => {
    expect(() =>
      messageSendSchema.parse({
        conversation_id: "550e8400-e29b-41d4-a716-446655440000",
        body: "Hello there",
        message_type: "text",
      })
    ).not.toThrow();
  });

  it("messageSendSchema rejects invalid message_type", () => {
    expect(() =>
      messageSendSchema.parse({ conversation_id: "550e8400-e29b-41d4-a716-446655440000", body: "hi", message_type: "email" as any })
    ).toThrow(z.ZodError);
  });

  it("conversationCreateSchema requires at least one participant", () => {
    expect(() =>
      conversationCreateSchema.parse({ type: "direct", participant_ids: ["550e8400-e29b-41d4-a716-446655440000"] })
    ).not.toThrow();
    expect(() =>
      conversationCreateSchema.parse({ type: "direct", participant_ids: [] })
    ).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Payment & Invoice
// ---------------------------------------------------------------------------

describe("validation — payment schemas", () => {
  it("invoiceCreateSchema accepts valid input", () => {
    expect(() =>
      invoiceCreateSchema.parse({
        collaboration_id: "550e8400-e29b-41d4-a716-446655440000",
        invoice_number: "INV-2026-001",
        amount: 1000,
        currency: "USD",
      })
    ).not.toThrow();
  });

  it("invoiceCreateSchema rejects non-positive amount", () => {
    expect(() =>
      invoiceCreateSchema.parse({
        collaboration_id: "550e8400-e29b-41d4-a716-446655440000",
        invoice_number: "INV-001",
        amount: 0,
      })
    ).toThrow(z.ZodError);
    expect(() =>
      invoiceCreateSchema.parse({
        collaboration_id: "550e8400-e29b-41d4-a716-446655440000",
        invoice_number: "INV-001",
        amount: -100,
      })
    ).toThrow(z.ZodError);
  });

  it("invoiceCreateSchema rejects missing invoice_number", () => {
    expect(() =>
      invoiceCreateSchema.parse({
        collaboration_id: "550e8400-e29b-41d4-a716-446655440000",
        invoice_number: "",
        amount: 100,
      })
    ).toThrow(z.ZodError);
  });

  it("refundCreateSchema accepts valid input", () => {
    expect(() =>
      refundCreateSchema.parse({
        payment_transaction_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: 500,
        currency: "USD",
        reason: "Customer cancelled",
      })
    ).not.toThrow();
  });

  it("refundCreateSchema rejects non-positive amount", () => {
    expect(() =>
      refundCreateSchema.parse({
        payment_transaction_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: -50,
      })
    ).toThrow(z.ZodError);
  });

  it("checkoutCreateSchema accepts valid URLs", () => {
    expect(() =>
      checkoutCreateSchema.parse({
        collaboration_id: "550e8400-e29b-41d4-a716-446655440000",
        invoice_id: "550e8400-e29b-41d4-a716-446655440001",
        success_url: "https://app.example.com/success",
        cancel_url: "https://app.example.com/cancel",
      })
    ).not.toThrow();
  });

  it("checkoutCreateSchema rejects invalid URLs", () => {
    expect(() =>
      checkoutCreateSchema.parse({
        collaboration_id: "550e8400-e29b-41d4-a716-446655440000",
        invoice_id: "550e8400-e29b-41d4-a716-446655440001",
        success_url: "not-a-url",
        cancel_url: "https://app.example.com/cancel",
      })
    ).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

describe("validation — review schemas", () => {
  it("reviewCreateSchema accepts valid input", () => {
    expect(() =>
      reviewCreateSchema.parse({
        collaboration_id: "550e8400-e29b-41d4-a716-446655440000",
        rating: 5,
        title: "Great experience",
        body: "Would recommend",
        is_public: true,
      })
    ).not.toThrow();
  });

  it("reviewCreateSchema rejects rating outside 1-5", () => {
    expect(() =>
      reviewCreateSchema.parse({ collaboration_id: "550e8400-e29b-41d4-a716-446655440000", rating: 0 })
    ).toThrow(z.ZodError);
    expect(() =>
      reviewCreateSchema.parse({ collaboration_id: "550e8400-e29b-41d4-a716-446655440000", rating: 6 })
    ).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

describe("validation — upload schemas", () => {
  const validBuckets = [
    "brand-logos",
    "creator-avatars",
    "creator-portfolios",
    "campaign-assets",
    "deliverable-submissions",
    "contracts",
    "messages",
  ];

  validBuckets.forEach((bucket) => {
    it(`uploadPresignSchema accepts ${bucket}`, () => {
      expect(() =>
        uploadPresignSchema.parse({ bucket, file_name: "image.png", content_type: "image/png" })
      ).not.toThrow();
    });
  });

  it("uploadPresignSchema rejects invalid bucket", () => {
    expect(() =>
      uploadPresignSchema.parse({ bucket: "evil-bucket" as any, file_name: "x", content_type: "image/png" })
    ).toThrow(z.ZodError);
  });

  it("uploadPresignSchema rejects missing file_name", () => {
    expect(() =>
      uploadPresignSchema.parse({ bucket: "brand-logos", file_name: "", content_type: "image/png" })
    ).toThrow(z.ZodError);
  });

  it("uploadPresignSchema rejects missing content_type", () => {
    expect(() =>
      uploadPresignSchema.parse({ bucket: "brand-logos", file_name: "x.png", content_type: "" })
    ).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

describe("validation — admin schemas", () => {
  it("adminActivityLogSchema accepts valid input", () => {
    expect(() =>
      adminActivityLogSchema.parse({
        action: "user.suspended",
        target_type: "user",
        target_id: "550e8400-e29b-41d4-a716-446655440000",
        metadata: { reason: "spam" },
      })
    ).not.toThrow();
  });

  it("adminActivityLogSchema rejects missing action", () => {
    expect(() => adminActivityLogSchema.parse({ action: "", target_type: "user" })).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// Discovery & matching
// ---------------------------------------------------------------------------

describe("validation — discovery schemas", () => {
  it("listCreatorsSchema accepts valid filters", () => {
    expect(() =>
      listCreatorsSchema.parse({
        limit: 20,
        offset: 0,
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        audienceSize: "micro",
        minFollowers: 10000,
        maxFollowers: 100000,
        search: "fashion",
        sortBy: "created_at",
        sortOrder: "desc",
      })
    ).not.toThrow();
  });

  it("listCreatorsSchema enforces limit 1-100", () => {
    expect(() => listCreatorsSchema.parse({ limit: 0 })).toThrow(z.ZodError);
    expect(() => listCreatorsSchema.parse({ limit: 101 })).toThrow(z.ZodError);
    expect(() => listCreatorsSchema.parse({ limit: 50 })).not.toThrow();
  });

  it("listCreatorsSchema rejects engagement rate outside 0-100", () => {
    expect(() =>
      listCreatorsSchema.parse({ minEngagementRate: -1 })
    ).toThrow(z.ZodError);
    expect(() =>
      listCreatorsSchema.parse({ maxEngagementRate: 101 })
    ).toThrow(z.ZodError);
  });

  it("matchingCriteriaSchema requires weights to sum to 100", () => {
    expect(() =>
      matchingCriteriaSchema.parse({
        nicheWeight: 30,
        platformWeight: 20,
        audienceWeight: 20,
        locationWeight: 15,
        budgetWeight: 10,
        availabilityWeight: 5,
      })
    ).not.toThrow();

    expect(() =>
      matchingCriteriaSchema.parse({
        nicheWeight: 50,
        platformWeight: 20,
        audienceWeight: 20,
        locationWeight: 15,
        budgetWeight: 10,
        availabilityWeight: 5,
      })
    ).toThrow(z.ZodError);
  });

  it("collectionCreateSchema validates slug format", () => {
    expect(() =>
      collectionCreateSchema.parse({ name: "My Favorites", slug: "my-favorites" })
    ).not.toThrow();
    expect(() =>
      collectionCreateSchema.parse({ name: "X", slug: "My Favorites" })
    ).toThrow(z.ZodError);
    expect(() =>
      collectionCreateSchema.parse({ name: "X", slug: "invalid_slug!" })
    ).toThrow(z.ZodError);
  });

  it("favoriteToggleSchema requires creator_profile_id", () => {
    expect(() =>
      favoriteToggleSchema.parse({ creator_profile_id: "550e8400-e29b-41d4-a716-446655440000" })
    ).not.toThrow();
    expect(() => favoriteToggleSchema.parse({ creator_profile_id: "bad" })).toThrow(z.ZodError);
  });
});

// ---------------------------------------------------------------------------
// parseZodError helper
// ---------------------------------------------------------------------------

describe("validation — parseZodError", () => {
  it("maps Zod issues to field/message pairs", () => {
    try {
      signupSchema.parse({
        email: "bad",
        password: "weak",
        confirm_password: "weak",
        full_name: "",
      });
    } catch (e) {
      const errors = parseZodError(e as z.ZodError);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      errors.forEach((err) => {
        expect(typeof err.field).toBe("string");
        expect(typeof err.message).toBe("string");
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Audience size bounds
// ---------------------------------------------------------------------------

describe("validation — audience size bounds", () => {
  it("AUDIENCE_SIZE_BOUNDS has all sizes", () => {
    expect(AUDIENCE_SIZE_BOUNDS.nano.min).toBe(1_000);
    expect(AUDIENCE_SIZE_BOUNDS.nano.max).toBe(10_000);
    expect(AUDIENCE_SIZE_BOUNDS.mega.min).toBe(1_000_000);
    expect(AUDIENCE_SIZE_BOUNDS.mega.max).toBeNull();
  });
});
