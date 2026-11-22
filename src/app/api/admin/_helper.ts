/**
 * CALLBACX MARKETING — Admin API route helper
 *
 * Standardized handler wrapper for admin API routes.
 * Validates input, runs the service action, and returns a consistent
 * JSON envelope. Platform-agnostic — usable by web and mobile clients.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler, type ServiceResult } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Response envelope
// ---------------------------------------------------------------------------

export function apiResponse<T>(
  data: T | null,
  meta: { limit: number; offset: number; total: number; has_more: boolean } | null = null,
  error: { code: string | null; message: string | null } | null = null
) {
  return NextResponse.json({
    success: error === null,
    data,
    error,
    meta,
  });
}

// ---------------------------------------------------------------------------
// Route handler wrapper
// ---------------------------------------------------------------------------

export type AdminRouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function withAdminRoute(
  handler: (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response>
) {
  return withErrorHandler(handler as any) as AdminRouteHandler;
}

// ---------------------------------------------------------------------------
// Extract validated query params
// ---------------------------------------------------------------------------

export function getQueryParams(req: NextRequest): Record<string, string> {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// ---------------------------------------------------------------------------
// Parse JSON body safely
// ---------------------------------------------------------------------------

export async function parseBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get server supabase client (cookie-bound)
// ---------------------------------------------------------------------------

export function getServerSupabase() {
  const cookieStore = cookies();
  return createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  });
}
