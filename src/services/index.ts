/**
 * CALLBACX TECHNOLOGY — Service layer barrel
 *
 * All business logic lives in these UI-independent service modules so they
 * can be reused by Next.js route handlers, Server Components, and a future
 * React Native/Expo client against the same Supabase backend.
 *
 * Never import Supabase clients directly in UI components — go through a
 * service module so validation, error handling, and RLS-boundary logic are
 * centralized.
 */

export * from "./auth";
export * from "./profiles";
export * from "./brands";
export * from "./creators";
export * from "./campaigns";
export * from "./applications";
export * from "./collaborations";
export * from "./messaging";
export * from "./notifications";
export * from "./payments";
export * from "./reviews";
export * from "./uploads";
export * from "./admin";

// Re-export error helpers so route handlers can use them.
export type { ServiceResult, ServiceError } from "@/lib/errors";
export { Errors, fail, ok, mapSupabaseError, withErrorHandler } from "@/lib/errors";
