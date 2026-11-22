/**
 * CALLBACX MARKETING — Supabase client factory
 *
 * Single source of truth for creating Supabase clients.
 * The browser client is memoized per module load; the server client
 * is created per request so cookies are always fresh.
 */

import { createServerClient } from "@supabase/ssr";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types/database";

// ---------------------------------------------------------------------------
// Request-scoped cache for getCurrentProfileId
// ---------------------------------------------------------------------------

/**
 * Simple request-scoped cache using WeakMap keyed by Supabase client instance.
 * Each server client is created per-request, so this naturally scopes to a single request.
 * The cache is automatically garbage collected when the client is no longer referenced.
 */
const profileIdCache = new WeakMap<any, Promise<string | null>>();

export function getCachedProfileId(supabase: any): Promise<string | null> {
  if (profileIdCache.has(supabase)) {
    return profileIdCache.get(supabase)!;
  }

  const promise = (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    return data?.id ?? null;
  })();

  profileIdCache.set(supabase, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * True only when the URL and anon key look like real Supabase credentials.
 * A real anon key is a JWT (starts with "eyJ"). Placeholder/empty values
 * (e.g. the committed .env.local.example) must be treated as "not configured"
 * so that middleware and server components degrade gracefully instead of
 * throwing and returning 500 on every request.
 */
function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  if (v === "") return true;
  if (/^placeholder/i.test(v)) return true;
  if (v.length < 20) return true;
  return false;
}

export const isSupabaseConfigured: boolean =
  !!supabaseUrl &&
  /^https?:\/\//i.test(supabaseUrl) &&
  !isPlaceholder(supabaseUrl) &&
  !!supabaseAnonKey &&
  !isPlaceholder(supabaseAnonKey) &&
  /^ey/i.test(supabaseAnonKey.trim());

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
 *
 * This is a lazy proxy: the underlying browser client is only constructed the
 * first time a property is accessed. Constructing `createBrowserClient` eagerly
 * at module load throws during server-side rendering when Supabase credentials
 * are missing or placeholders, which previously 500'd every page whose import
 * graph included this module.
 */
export const supabase: ReturnType<typeof getSupabaseClient> = new Proxy(
  {} as ReturnType<typeof getSupabaseClient>,
  {
    get(_target, prop) {
      const client = getSupabaseClient();
      const value = (client as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);

// ---------------------------------------------------------------------------
// Server client (server components, route handlers, middleware)
// ---------------------------------------------------------------------------

/**
 * Create a per-request Supabase client bound to the request cookies.
 * Use this in Next.js Server Components and Route Handlers so the user's
 * session is correctly read and refreshed.
 *
 * Accepts a Next.js `ReadonlyRequestCookies` (returned by `cookies()`).
 * `setAll` is a no-op since the request cookie store is read-only; session
 * refresh is handled by the browser client or middleware.
 */
export function createSupabaseServerClient(cookieStore: {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: any) => void;
}) {
  return createServerClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Admin / service-role client (server-only, privileged)
// ---------------------------------------------------------------------------

let _adminClient: any | null = null;

/**
 * Service-role client. Bypasses RLS — use ONLY in server-side code for
 * privileged operations (webhook ingestion, payment confirmation, admin flows).
 * Never expose this key to the browser.
 */
export function getSupabaseAdminClient(): any {
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