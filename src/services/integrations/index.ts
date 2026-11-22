/**
 * CALLBACX TECHNOLOGY — Integration services barrel
 *
 * External integration architecture:
 * - settings: platform-wide provider configuration + encrypted credentials vault
 * - connections: user-level OAuth/API connections with status indicators
 * - oauth: OAuth 2.0 authorize + callback for social providers
 * - email: Resend (or equivalent) transactional email delivery
 * - stripe: Stripe payments and payouts
 * - storage: Supabase Storage server-side operations
 * - social: Instagram / TikTok / YouTube provider clients
 * - sync: social metrics imports through authorised APIs
 * - webhooks: idempotent webhook ingestion
 *
 * Never fabricate external API data. Providers requiring external
 * credentials or approval return INTEGRATION_NOT_CONFIGURED until an
 * administrator sets them up.
 */

export * from "./settings";
export * from "./connections";
export * from "./oauth";
export * from "./email";
export * from "./stripe";
export * from "./storage";
export * from "./social";
export * from "./sync";
export * from "./webhooks";
