/**
 * CALLBACX TECHNOLOGY â€” Demo Data Service
 *
 * Realistic demo data clearly separated from production data.
 * All data is prefixed with "demo-" and marked with __demo: true flag.
 * This service should ONLY be used when NEXT_PUBLIC_DEMO_MODE === "true".
 */

import type {
  Campaigns,
  CampaignStatus,
  CampaignVisibility,
  CompensationModel,
  CreatorProfiles,
  CreatorSocialAccounts,
  CreatorPortfolios,
  CreatorMedia,
  CampaignApplications,
  ApplicationStatus,
  Collaborations,
  CollaborationStatus,
  Conversations,
  Messages,
  Invoices,
  InvoiceStatus,
  PaymentTransactions,
  PaymentStatus,
  CreatorPayouts,
  PayoutStatus,
  CampaignAnalytics,
  CreatorAnalytics,
  BrandCategories,
  CreatorCategories,
} from "@/lib/supabase/types/database";

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

if (!isDemoMode && process.env.NODE_ENV === "development") {
  console.warn("[DemoData] Demo mode is disabled. Set NEXT_PUBLIC_DEMO_MODE=true to enable demo data.");
}

// ---------------------------------------------------------------------------
// Demo Data Flag
// ---------------------------------------------------------------------------

export const DEMO_DATA_MARKER = "__demo";
export const DEMO_PREFIX = "demo-";

// ---------------------------------------------------------------------------
// Brand Categories
// ---------------------------------------------------------------------------

export const demoBrandCategories: (BrandCategories & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-cat-1", name: "Technology", slug: "technology", description: "Software, hardware, and tech services", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-cat-2", name: "Fashion & Beauty", slug: "fashion-beauty", description: "Clothing, cosmetics, and accessories", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-cat-3", name: "Food & Beverage", slug: "food-beverage", description: "Restaurants, snacks, and drinks", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-cat-4", name: "Health & Wellness", slug: "health-wellness", description: "Fitness, supplements, and wellness", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-cat-5", name: "Travel & Lifestyle", slug: "travel-lifestyle", description: "Hotels, airlines, and experiences", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-cat-6", name: "Home & Garden", slug: "home-garden", description: "Furniture, decor, and gardening", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Creator Categories
// ---------------------------------------------------------------------------

export const demoCreatorCategories: (CreatorCategories & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-ccat-1", name: "Lifestyle", slug: "lifestyle", description: "Daily life, routines, and personal content", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-ccat-2", name: "Technology", slug: "technology", description: "Tech reviews, tutorials, and news", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-ccat-3", name: "Beauty & Fashion", slug: "beauty-fashion", description: "Makeup, skincare, and style", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-ccat-4", name: "Fitness & Health", slug: "fitness-health", description: "Workouts, nutrition, and wellness", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-ccat-5", name: "Gaming", slug: "gaming", description: "Video games, streaming, and esports", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-ccat-6", name: "Travel", slug: "travel", description: "Destinations, tips, and adventures", created_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Brand Profile
// ---------------------------------------------------------------------------

export const demoBrand = {
  id: "demo-brand-1",
  owner_id: "demo-brand-1",
  name: "Acme Corporation",
  legal_name: "Acme Corporation Inc.",
  trade_name: "Acme",
  description: "Leading innovative solutions since 2010. We build products that make life easier.",
  website_url: "https://acme.example.com",
  contact_email: "partnerships@acme.example.com",
  contact_phone: "+1 (555) 123-4567",
  address: { street: "100 Innovation Drive", city: "San Francisco", state: "CA", zip: "94105", country: "US" },
  brand_category_id: "demo-cat-1",
  logo_url: null,
  brand_kit: { primary_color: "#4F46E5", secondary_color: "#D9653E", font: "Inter" },
  verification_status: "verified",
  verified_at: "2024-01-15T10:00:00Z",
  verified_by: "demo-admin-1",
  is_active: true,
  status: "active" as const,
  created_at: "2023-01-15T10:00:00Z",
  updated_at: new Date().toISOString(),
  deleted_at: null,
  [DEMO_DATA_MARKER]: true,
};

// ---------------------------------------------------------------------------
// Demo Creator Profile
// ---------------------------------------------------------------------------

export const demoCreatorProfile: (CreatorProfiles & { [DEMO_DATA_MARKER]: true }) = {
  id: "demo-creator-profile-1",
  profile_id: "demo-creator-1",
  display_name: "Alex Creator",
  bio: "Lifestyle & Tech Content Creator | 500K+ followers across platforms. Sharing daily life, tech reviews, and travel adventures. ðŸŒŸ",
  location: { city: "Los Angeles", state: "CA", country: "US" },
  languages: ["en", "es"],
  avatar_url: null,
  cover_url: null,
  contact_email: "alex@creator.example.com",
  website_url: "https://alexcreator.example.com",
  availability_status: "open",
  collaboration_preferences: { min_budget: 500, preferred_platforms: ["instagram", "tiktok", "youtube"], content_types: ["reels", "stories", "posts", "videos"] },
  verification_status: "verified",
  is_active: true,
  created_at: "2023-06-20T10:00:00Z",
  updated_at: new Date().toISOString(),
  deleted_at: null,
  [DEMO_DATA_MARKER]: true,
};

// ---------------------------------------------------------------------------
// Demo Creator Social Accounts
// ---------------------------------------------------------------------------

export const demoCreatorSocialAccounts: (CreatorSocialAccounts & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-social-1", creator_profile_id: "demo-creator-profile-1", platform: "instagram", platform_user_id: "ig_123456", username: "alexcreator", profile_url: "https://instagram.com/alexcreator", is_verified: true, followers_count: 285000, engagement_rate: 4.2, metrics_source: "manual", last_synced_at: new Date().toISOString(), created_at: "2023-06-20T10:00:00Z", updated_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-social-2", creator_profile_id: "demo-creator-profile-1", platform: "tiktok", platform_user_id: "tt_789012", username: "alexcreator", profile_url: "https://tiktok.com/@alexcreator", is_verified: true, followers_count: 180000, engagement_rate: 6.8, metrics_source: "manual", last_synced_at: new Date().toISOString(), created_at: "2023-06-20T10:00:00Z", updated_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-social-3", creator_profile_id: "demo-creator-profile-1", platform: "youtube", platform_user_id: "yt_345678", username: "AlexCreator", profile_url: "https://youtube.com/@alexcreator", is_verified: false, followers_count: 45000, engagement_rate: 3.1, metrics_source: "manual", last_synced_at: new Date().toISOString(), created_at: "2023-06-20T10:00:00Z", updated_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Creator Portfolio
// ---------------------------------------------------------------------------

export const demoCreatorPortfolios: (CreatorPortfolios & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-portfolio-1", creator_profile_id: "demo-creator-profile-1", title: "Tech Reviews", description: "In-depth smartphone and gadget reviews", is_public: true, sort_order: 1, created_at: "2023-07-01T10:00:00Z", updated_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-portfolio-2", creator_profile_id: "demo-creator-profile-1", title: "Lifestyle Vlogs", description: "Daily life, travel, and routines", is_public: true, sort_order: 2, created_at: "2023-07-01T10:00:00Z", updated_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-portfolio-3", creator_profile_id: "demo-creator-profile-1", title: "Brand Collaborations", description: "Sponsored content and partnerships", is_public: true, sort_order: 3, created_at: "2023-07-01T10:00:00Z", updated_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Creator Media
// ---------------------------------------------------------------------------

export const demoCreatorMedia: (CreatorMedia & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-media-1", creator_profile_id: "demo-creator-profile-1", portfolio_id: "demo-portfolio-1", storage_path: "demo/creator-profile-1/media/tech-review-1.jpg", media_kind: "image", title: "iPhone 15 Pro Review", caption: "Deep dive into the new iPhone 15 Pro", duration_seconds: null, created_at: "2024-01-15T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-media-2", creator_profile_id: "demo-creator-profile-1", portfolio_id: "demo-portfolio-1", storage_path: "demo/creator-profile-1/media/tech-review-2.jpg", media_kind: "image", title: "MacBook Air M3 Review", caption: "Is the M3 worth the upgrade?", duration_seconds: null, created_at: "2024-01-20T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-media-3", creator_profile_id: "demo-creator-profile-1", portfolio_id: "demo-portfolio-2", storage_path: "demo/creator-profile-1/media/travel-japan.jpg", media_kind: "image", title: "Japan Travel Vlog", caption: "Two weeks in Tokyo and Kyoto", duration_seconds: null, created_at: "2024-02-01T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-media-4", creator_profile_id: "demo-creator-profile-1", portfolio_id: "demo-portfolio-3", storage_path: "demo/creator-profile-1/media/brand-collab-1.jpg", media_kind: "image", title: "Nike Campaign", caption: "Just Do It campaign behind the scenes", duration_seconds: null, created_at: "2024-02-10T10:00:00Z", [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Campaigns
// ---------------------------------------------------------------------------

export const demoCampaigns: (Campaigns & { [DEMO_DATA_MARKER]: true })[] = [
  {
    id: "demo-campaign-1",
    brand_id: "demo-brand-1",
    title: "Summer Tech Essentials Campaign",
    description: "Promote our latest lineup of summer-ready tech accessories including portable chargers, wireless earbuds, and phone cooling cases.",
    brief: "Create engaging content showcasing how Acme's tech accessories enhance your summer adventures. Focus on portability, durability, and style.",
    category_id: "demo-cat-1",
    status: "published" as CampaignStatus,
    objective: "brand_awareness",
    target_audience: { age_range: "18-35", interests: ["technology", "travel", "outdoor"], locations: ["US", "CA", "UK"] },
    budget_total: 50000,
    budget_currency: "USD",
    budget_spent: 0,
    compensation_model: "flat_fee" as CompensationModel,
    payment_terms: "Net 30",
    start_date: "2024-06-01T00:00:00Z",
    end_date: "2024-08-31T23:59:59Z",
    application_deadline: "2024-05-15T23:59:59Z",
    location_requirements: { countries: ["US", "CA"], regions: [] },
    platform_requirements: ["instagram", "tiktok", "youtube"],
    visibility: "public" as CampaignVisibility,
    approval_required: true,
    approved_at: "2024-04-01T10:00:00Z",
    approved_by: "demo-brand-1",
    is_active: true,
    created_at: "2024-03-15T10:00:00Z",
    updated_at: new Date().toISOString(),
    deleted_at: null,
    [DEMO_DATA_MARKER]: true,
  },
  {
    id: "demo-campaign-2",
    brand_id: "demo-brand-1",
    title: "Back to School Laptop Campaign",
    description: "Showcase our new student-friendly laptops with focus on performance, battery life, and affordability.",
    brief: "Target students and parents with authentic content about choosing the right laptop for the school year.",
    category_id: "demo-cat-1",
    status: "published" as CampaignStatus,
    objective: "conversions",
    target_audience: { age_range: "16-24", interests: ["education", "technology", "gaming"], locations: ["US"] },
    budget_total: 75000,
    budget_currency: "USD",
    budget_spent: 0,
    compensation_model: "per_deliverable" as CompensationModel,
    payment_terms: "Net 15",
    start_date: "2024-07-01T00:00:00Z",
    end_date: "2024-09-30T23:59:59Z",
    application_deadline: "2024-06-15T23:59:59Z",
    location_requirements: { countries: ["US"], regions: [] },
    platform_requirements: ["instagram", "tiktok", "youtube"],
    visibility: "public" as CampaignVisibility,
    approval_required: true,
    approved_at: "2024-05-01T10:00:00Z",
    approved_by: "demo-brand-1",
    is_active: true,
    created_at: "2024-04-15T10:00:00Z",
    updated_at: new Date().toISOString(),
    deleted_at: null,
    [DEMO_DATA_MARKER]: true,
  },
  {
    id: "demo-campaign-3",
    brand_id: "demo-brand-1",
    title: "Holiday Gift Guide Campaign",
    description: "Feature Acme products in holiday gift guides across multiple creator channels.",
    brief: "Create holiday-themed content featuring Acme products as perfect gifts for tech enthusiasts.",
    category_id: "demo-cat-1",
    status: "draft" as CampaignStatus,
    objective: "sales",
    target_audience: { age_range: "18-45", interests: ["technology", "shopping", "gifts"], locations: ["US", "CA", "UK", "AU"] },
    budget_total: 100000,
    budget_currency: "USD",
    budget_spent: 0,
    compensation_model: "performance" as CompensationModel,
    payment_terms: "Net 30",
    start_date: "2024-11-01T00:00:00Z",
    end_date: "2024-12-31T23:59:59Z",
    application_deadline: "2024-10-15T23:59:59Z",
    location_requirements: { countries: ["US", "CA", "UK", "AU"], regions: [] },
    platform_requirements: ["instagram", "tiktok", "youtube", "pinterest"],
    visibility: "invite_only" as CampaignVisibility,
    approval_required: true,
    approved_at: null,
    approved_by: null,
    is_active: true,
    created_at: "2024-08-01T10:00:00Z",
    updated_at: new Date().toISOString(),
    deleted_at: null,
    [DEMO_DATA_MARKER]: true,
  },
  {
    id: "demo-campaign-4",
    brand_id: "demo-brand-1",
    title: "Wireless Earbuds Launch",
    description: "Launch campaign for our new flagship wireless earbuds with active noise cancellation.",
    brief: "Create immersive audio-focused content highlighting ANC quality, battery life, and comfort.",
    category_id: "demo-cat-1",
    status: "active" as CampaignStatus,
    objective: "product_launch",
    target_audience: { age_range: "18-35", interests: ["music", "technology", "commuting", "fitness"], locations: ["US", "CA"] },
    budget_total: 150000,
    budget_currency: "USD",
    budget_spent: 0,
    compensation_model: "flat_fee" as CompensationModel,
    payment_terms: "Net 15",
    start_date: "2024-03-01T00:00:00Z",
    end_date: "2024-05-31T23:59:59Z",
    application_deadline: "2024-02-15T23:59:59Z",
    location_requirements: { countries: ["US", "CA"], regions: [] },
    platform_requirements: ["instagram", "tiktok", "youtube"],
    visibility: "public" as CampaignVisibility,
    approval_required: true,
    approved_at: "2024-01-15T10:00:00Z",
    approved_by: "demo-brand-1",
    is_active: true,
    created_at: "2023-12-01T10:00:00Z",
    updated_at: new Date().toISOString(),
    deleted_at: null,
    [DEMO_DATA_MARKER]: true,
  },
  {
    id: "demo-campaign-5",
    brand_id: "demo-brand-1",
    title: "Portable Power Bank Series",
    description: "Campaign for our new line of ultra-fast charging power banks.",
    brief: "Showcase real-world usage scenarios where fast charging makes a difference.",
    category_id: "demo-cat-1",
    status: "completed" as CampaignStatus,
    objective: "brand_awareness",
    target_audience: { age_range: "18-40", interests: ["travel", "technology", "outdoor"], locations: ["US", "CA", "UK"] },
    budget_total: 60000,
    budget_currency: "USD",
    budget_spent: 0,
    compensation_model: "flat_fee" as CompensationModel,
    payment_terms: "Net 30",
    start_date: "2024-01-01T00:00:00Z",
    end_date: "2024-03-31T23:59:59Z",
    application_deadline: "2023-12-15T23:59:59Z",
    location_requirements: { countries: ["US", "CA", "UK"], regions: [] },
    platform_requirements: ["instagram", "tiktok", "youtube"],
    visibility: "public" as CampaignVisibility,
    approval_required: true,
    approved_at: "2023-11-15T10:00:00Z",
    approved_by: "demo-brand-1",
    is_active: true,
    created_at: "2023-10-15T10:00:00Z",
    updated_at: new Date().toISOString(),
    deleted_at: null,
    [DEMO_DATA_MARKER]: true,
  },
];

// ---------------------------------------------------------------------------
// Demo Campaign Applications
// ---------------------------------------------------------------------------

export const demoCampaignApplications: (CampaignApplications & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-app-1", campaign_id: "demo-campaign-1", creator_profile_id: "demo-creator-profile-1", cover_letter: "I'd love to showcase your summer tech essentials! My audience loves travel and tech content.", proposed_rate: 2500, currency: "USD", status: "accepted" as ApplicationStatus, applied_at: "2024-04-01T10:00:00Z", reviewed_at: "2024-04-05T10:00:00Z", reviewed_by: "demo-brand-1", rejection_reason: null, [DEMO_DATA_MARKER]: true },
  { id: "demo-app-2", campaign_id: "demo-campaign-1", creator_profile_id: "demo-creator-profile-2", cover_letter: "Perfect fit for my tech review channel!", proposed_rate: 3000, currency: "USD", status: "under_review" as ApplicationStatus, applied_at: "2024-04-02T10:00:00Z", reviewed_at: null, reviewed_by: null, rejection_reason: null, [DEMO_DATA_MARKER]: true },
  { id: "demo-app-3", campaign_id: "demo-campaign-2", creator_profile_id: "demo-creator-profile-1", cover_letter: "Great campaign for back-to-school season.", proposed_rate: 3500, currency: "USD", status: "pending" as ApplicationStatus, applied_at: "2024-05-01T10:00:00Z", reviewed_at: null, reviewed_by: null, rejection_reason: null, [DEMO_DATA_MARKER]: true },
  { id: "demo-app-4", campaign_id: "demo-campaign-4", creator_profile_id: "demo-creator-profile-1", cover_letter: "Love the new earbuds! Would create amazing audio content.", proposed_rate: 5000, currency: "USD", status: "accepted" as ApplicationStatus, applied_at: "2024-01-20T10:00:00Z", reviewed_at: "2024-01-25T10:00:00Z", reviewed_by: "demo-brand-1", rejection_reason: null, [DEMO_DATA_MARKER]: true },
  { id: "demo-app-5", campaign_id: "demo-campaign-4", creator_profile_id: "demo-creator-profile-3", cover_letter: "Perfect for my commute and fitness content.", proposed_rate: 4000, currency: "USD", status: "rejected" as ApplicationStatus, applied_at: "2024-01-22T10:00:00Z", reviewed_at: "2024-01-28T10:00:00Z", reviewed_by: "demo-brand-1", rejection_reason: "Budget constraints", [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Collaborations
// ---------------------------------------------------------------------------

export const demoCollaborations: (Collaborations & { [DEMO_DATA_MARKER]: true })[] = [
  {
    id: "demo-collab-1",
    campaign_id: "demo-campaign-1",
    brand_id: "demo-brand-1",
    creator_profile_id: "demo-creator-profile-1",
    status: "active" as CollaborationStatus,
    agreed_fee: 2500,
    currency: "USD",
    contract_id: "demo-contract-1",
    started_at: "2024-06-01T10:00:00Z",
    completed_at: null,
    created_at: "2024-04-05T10:00:00Z",
    updated_at: new Date().toISOString(),
    deleted_at: null,
    [DEMO_DATA_MARKER]: true,
  },
  {
    id: "demo-collab-2",
    campaign_id: "demo-campaign-4",
    brand_id: "demo-brand-1",
    creator_profile_id: "demo-creator-profile-1",
    status: "completed" as CollaborationStatus,
    agreed_fee: 5000,
    currency: "USD",
    contract_id: "demo-contract-2",
    started_at: "2024-03-01T10:00:00Z",
    completed_at: "2024-05-31T23:59:59Z",
    created_at: "2024-01-25T10:00:00Z",
    updated_at: "2024-05-31T23:59:59Z",
    deleted_at: null,
    [DEMO_DATA_MARKER]: true,
  },
  {
    id: "demo-collab-3",
    campaign_id: "demo-campaign-5",
    brand_id: "demo-brand-1",
    creator_profile_id: "demo-creator-profile-1",
    status: "completed" as CollaborationStatus,
    agreed_fee: 3000,
    currency: "USD",
    contract_id: "demo-contract-3",
    started_at: "2024-01-01T10:00:00Z",
    completed_at: "2024-03-31T23:59:59Z",
    created_at: "2023-12-15T10:00:00Z",
    updated_at: "2024-03-31T23:59:59Z",
    deleted_at: null,
    [DEMO_DATA_MARKER]: true,
  },
];

// ---------------------------------------------------------------------------
// Demo Conversations
// ---------------------------------------------------------------------------

export const demoConversations: (Conversations & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-conv-1", type: "direct" as const, title: "Summer Tech Campaign Discussion", created_by: "demo-brand-1", created_at: "2024-04-05T10:00:00Z", updated_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
  { id: "demo-conv-2", type: "direct" as const, title: "Earbuds Launch Campaign", created_by: "demo-brand-1", created_at: "2024-01-25T10:00:00Z", updated_at: "2024-05-31T23:59:59Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-conv-3", type: "direct" as const, title: "Power Bank Campaign Wrap-up", created_by: "demo-brand-1", created_at: "2023-12-15T10:00:00Z", updated_at: "2024-03-31T23:59:59Z", [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Messages
// ---------------------------------------------------------------------------

export const demoMessages: (Messages & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-msg-1", conversation_id: "demo-conv-1", sender_id: "demo-brand-1", body: "Hi Alex! Welcome to the Summer Tech Essentials campaign. Excited to work with you!", message_type: "text" as const, edited_at: null, deleted_at: null, created_at: "2024-04-05T10:30:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-msg-2", conversation_id: "demo-conv-1", sender_id: "demo-creator-1", body: "Thanks! I'm excited too. When do you need the first deliverable?", message_type: "text" as const, edited_at: null, deleted_at: null, created_at: "2024-04-05T11:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-msg-3", conversation_id: "demo-conv-1", sender_id: "demo-brand-1", body: "First deliverable (Instagram Reel) is due by June 15th. Let me know if you need any assets!", message_type: "text" as const, edited_at: null, deleted_at: null, created_at: "2024-04-05T11:15:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-msg-4", conversation_id: "demo-conv-2", sender_id: "demo-brand-1", body: "Great work on the earbuds launch! The content performed really well.", message_type: "text" as const, edited_at: null, deleted_at: null, created_at: "2024-05-20T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-msg-5", conversation_id: "demo-conv-2", sender_id: "demo-creator-1", body: "Thank you! It was a fun product to showcase. The ANC really impressed me.", message_type: "text" as const, edited_at: null, deleted_at: null, created_at: "2024-05-20T10:30:00Z", [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Invoices
// ---------------------------------------------------------------------------

export const demoInvoices: (Invoices & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-inv-1", invoice_number: "INV-2024-001", collaboration_id: "demo-collab-1", brand_id: "demo-brand-1", creator_profile_id: "demo-creator-profile-1", amount: 2500, currency: "USD", status: "paid" as InvoiceStatus, due_date: "2024-07-01T23:59:59Z", paid_at: "2024-06-25T10:00:00Z", pdf_storage_path: "demo/invoices/INV-2024-001.pdf", created_at: "2024-06-01T10:00:00Z", updated_at: "2024-06-25T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-inv-2", invoice_number: "INV-2024-002", collaboration_id: "demo-collab-2", brand_id: "demo-brand-1", creator_profile_id: "demo-creator-profile-1", amount: 5000, currency: "USD", status: "paid" as InvoiceStatus, due_date: "2024-06-15T23:59:59Z", paid_at: "2024-06-10T10:00:00Z", pdf_storage_path: "demo/invoices/INV-2024-002.pdf", created_at: "2024-05-15T10:00:00Z", updated_at: "2024-06-10T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-inv-3", invoice_number: "INV-2024-003", collaboration_id: "demo-collab-3", brand_id: "demo-brand-1", creator_profile_id: "demo-creator-profile-1", amount: 3000, currency: "USD", status: "paid" as InvoiceStatus, due_date: "2024-04-30T23:59:59Z", paid_at: "2024-04-25T10:00:00Z", pdf_storage_path: "demo/invoices/INV-2024-003.pdf", created_at: "2024-04-01T10:00:00Z", updated_at: "2024-04-25T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-inv-4", invoice_number: "INV-2024-004", collaboration_id: "demo-collab-1", brand_id: "demo-brand-1", creator_profile_id: "demo-creator-profile-1", amount: 2500, currency: "USD", status: "sent" as InvoiceStatus, due_date: "2024-08-01T23:59:59Z", paid_at: null, pdf_storage_path: "demo/invoices/INV-2024-004.pdf", created_at: "2024-07-01T10:00:00Z", updated_at: new Date().toISOString(), [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Payment Transactions
// ---------------------------------------------------------------------------

export const demoPaymentTransactions: (PaymentTransactions & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-pay-1", collaboration_id: "demo-collab-1", invoice_id: "demo-inv-1", provider: "stripe", provider_payment_id: "pi_demo_1", idempotency_key: "idem_demo_1", amount: 2500, currency: "USD", status: "succeeded" as PaymentStatus, fee_amount: 75, creator_amount: 2425, metadata: { invoice_number: "INV-2024-001" }, created_at: "2024-06-25T10:00:00Z", updated_at: "2024-06-25T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-pay-2", collaboration_id: "demo-collab-2", invoice_id: "demo-inv-2", provider: "stripe", provider_payment_id: "pi_demo_2", idempotency_key: "idem_demo_2", amount: 5000, currency: "USD", status: "succeeded" as PaymentStatus, fee_amount: 150, creator_amount: 4850, metadata: { invoice_number: "INV-2024-002" }, created_at: "2024-06-10T10:00:00Z", updated_at: "2024-06-10T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-pay-3", collaboration_id: "demo-collab-3", invoice_id: "demo-inv-3", provider: "stripe", provider_payment_id: "pi_demo_3", idempotency_key: "idem_demo_3", amount: 3000, currency: "USD", status: "succeeded" as PaymentStatus, fee_amount: 90, creator_amount: 2910, metadata: { invoice_number: "INV-2024-003" }, created_at: "2024-04-25T10:00:00Z", updated_at: "2024-04-25T10:00:00Z", [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Creator Payouts
// ---------------------------------------------------------------------------

export const demoCreatorPayouts: (CreatorPayouts & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-payout-1", creator_profile_id: "demo-creator-profile-1", payment_transaction_id: "demo-pay-1", amount: 2425, currency: "USD",     status: "paid" as PayoutStatus,
    provider_payout_id: "po_demo_1",
    paid_at: "2024-06-25T10:00:00Z",
    processed_by: null, created_at: "2024-06-25T10:00:00Z", updated_at: "2024-06-25T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-payout-2", creator_profile_id: "demo-creator-profile-1", payment_transaction_id: "demo-pay-2", amount: 4850, currency: "USD",     status: "paid" as PayoutStatus,
    provider_payout_id: "po_demo_2",
    paid_at: "2024-06-10T10:00:00Z",
    processed_by: null, created_at: "2024-06-10T10:00:00Z", updated_at: "2024-06-10T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-payout-3", creator_profile_id: "demo-creator-profile-1", payment_transaction_id: "demo-pay-3", amount: 2910, currency: "USD",     status: "paid" as PayoutStatus,
    provider_payout_id: "po_demo_3",
    paid_at: "2024-04-25T10:00:00Z",
    processed_by: null, created_at: "2024-04-25T10:00:00Z", updated_at: "2024-04-25T10:00:00Z", [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Campaign Analytics
// ---------------------------------------------------------------------------

export const demoCampaignAnalytics: (CampaignAnalytics & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-ca-1", campaign_id: "demo-campaign-1", metric_date: "2024-06-15", impressions: 125000, reach: 89000, engagement: 8500, clicks: 3200, conversions: 145, revenue: 12500, source: "instagram", collected_at: "2024-06-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-ca-2", campaign_id: "demo-campaign-1", metric_date: "2024-06-15", impressions: 98000, reach: 72000, engagement: 6800, clicks: 2100, conversions: 89, revenue: 8900, source: "tiktok", collected_at: "2024-06-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-ca-3", campaign_id: "demo-campaign-1", metric_date: "2024-06-15", impressions: 45000, reach: 38000, engagement: 2100, clicks: 890, conversions: 34, revenue: 3400, source: "youtube", collected_at: "2024-06-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-ca-4", campaign_id: "demo-campaign-4", metric_date: "2024-03-15", impressions: 280000, reach: 195000, engagement: 22000, clicks: 8500, conversions: 420, revenue: 42000, source: "instagram", collected_at: "2024-03-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-ca-5", campaign_id: "demo-campaign-4", metric_date: "2024-03-15", impressions: 195000, reach: 142000, engagement: 15500, clicks: 5200, conversions: 280, revenue: 28000, source: "tiktok", collected_at: "2024-03-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-ca-6", campaign_id: "demo-campaign-5", metric_date: "2024-02-15", impressions: 156000, reach: 112000, engagement: 11200, clicks: 4100, conversions: 195, revenue: 19500, source: "instagram", collected_at: "2024-02-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Creator Analytics
// ---------------------------------------------------------------------------

export const demoCreatorAnalytics: (CreatorAnalytics & { [DEMO_DATA_MARKER]: true })[] = [
  { id: "demo-cr-1", creator_profile_id: "demo-creator-profile-1", metric_date: "2024-06-15", impressions: 450000, reach: 320000, engagement: 28500, clicks: 12500, conversions: 450, revenue: 12500, source: "instagram", collected_at: "2024-06-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-cr-2", creator_profile_id: "demo-creator-profile-1", metric_date: "2024-06-15", impressions: 380000, reach: 280000, engagement: 22400, clicks: 9800, conversions: 320, revenue: 8900, source: "tiktok", collected_at: "2024-06-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
  { id: "demo-cr-3", creator_profile_id: "demo-creator-profile-1", metric_date: "2024-06-15", impressions: 120000, reach: 95000, engagement: 4200, clicks: 2100, conversions: 85, revenue: 3400, source: "youtube", collected_at: "2024-06-16T10:00:00Z", [DEMO_DATA_MARKER]: true },
];

// ---------------------------------------------------------------------------
// Demo Data Access Functions
// ---------------------------------------------------------------------------

export function getDemoData<T>(data: T[]): T[] {
  if (!isDemoMode) return [];
  return data.filter(item => (item as any)[DEMO_DATA_MARKER] === true);
}

export const demoData = {
  brandCategories: demoBrandCategories,
  creatorCategories: demoCreatorCategories,
  brand: demoBrand,
  creatorProfile: demoCreatorProfile,
  creatorSocialAccounts: demoCreatorSocialAccounts,
  creatorPortfolios: demoCreatorPortfolios,
  creatorMedia: demoCreatorMedia,
  campaigns: demoCampaigns,
  campaignApplications: demoCampaignApplications,
  collaborations: demoCollaborations,
  conversations: demoConversations,
  messages: demoMessages,
  invoices: demoInvoices,
  paymentTransactions: demoPaymentTransactions,
  creatorPayouts: demoCreatorPayouts,
  campaignAnalytics: demoCampaignAnalytics,
  creatorAnalytics: demoCreatorAnalytics,
};

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isDemoData(item: any): boolean {
  return item && item[DEMO_DATA_MARKER] === true;
}

export function filterDemoData<T extends Record<string, any>>(data: T[]): T[] {
  return data.filter(item => !isDemoData(item));
}

