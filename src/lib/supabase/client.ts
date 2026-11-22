/**
 * CALLBACX TECHNOLOGY â€” Supabase client factory
 *
 * Single source of truth for creating Supabase clients.
 * The browser client is memoized per module load; the server client
 * is created per request so cookies are always fresh.
 */

import { createServerClient } from "@supabase/ssr";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types/database";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (typeof window === "undefined") {
  // Server-side validation (never log the secret key itself).
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Server-side queries will fail until these are set."
    );
  }
  if (!supabaseServiceRoleKey) {
    console.warn(
      "[supabase] Missing SUPABASE_SERVICE_ROLE_KEY. Privileged server operations " +
        "(payment processing, webhook handling, admin actions) will fail."
    );
  }
}

// ---------------------------------------------------------------------------
// Browser client (client components, hooks)
// ---------------------------------------------------------------------------

let _browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
  if (_browserClient) return _browserClient;
  _browserClient = createBrowserClient<Database>(
    supabaseUrl as string,
    supabaseAnonKey as string
  );
  return _browserClient;
}

/**
 * Convenience hook-style export. Prefer `getSupabaseClient()` inside effects
 * and event handlers so the client is stable across renders.
 */
export const supabase = getSupabaseClient();

// ---------------------------------------------------------------------------
// Server client (server components, route handlers, middleware)
// ---------------------------------------------------------------------------

/**
 * Create a per-request Supabase client bound to the request cookies.
 * Use this in Next.js Server Components and Route Handlers so the user's
 * session is correctly read and refreshed.
 */
export function createSupabaseServerClient(cookies: {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void;
}) {
  return createServerClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
    cookies,
  });
}

// ---------------------------------------------------------------------------
// Admin / service-role client (server-only, privileged)
// ---------------------------------------------------------------------------

let _adminClient: ReturnType<typeof createServerClient<Database>> | null = null;

/**
 * Service-role client. Bypasses RLS â€” use ONLY in server-side code for
 * privileged operations (webhook ingestion, payment confirmation, admin flows).
 * Never expose this key to the browser.
 */
export function getSupabaseAdminClient() {
  if (_adminClient) return _adminClient;
  if (typeof window !== "undefined") {
    throw new Error(
      "[supabase] getSupabaseAdminClient() must not be called in the browser. " +
        "The service-role key is server-only."
    );
  }
  _adminClient = createServerClient<Database>(
    supabaseUrl as string,
    supabaseServiceRoleKey as string,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
  return _adminClient;
}

