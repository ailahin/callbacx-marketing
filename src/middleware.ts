import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Route Protection Middleware
// ---------------------------------------------------------------------------

// Only run middleware on dashboard routes - public routes are handled by layout/components
const DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/brand",
  "/dashboard/creator",
  "/dashboard/admin",
];

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

// Request-scoped cache for middleware Supabase queries
// Keyed by request ID to avoid duplicate queries within same request
const requestCache = new WeakMap<NextRequest, {
  session: Promise<any>;
  profile: Promise<any>;
  roles: Promise<any>;
  brandMember: Promise<any>;
  creatorProfile: Promise<any>;
}>();

function getOrCreateCache(request: NextRequest) {
  if (!requestCache.has(request)) {
    requestCache.set(request, {
      session: Promise.resolve(null),
      profile: Promise.resolve(null),
      roles: Promise.resolve(null),
      brandMember: Promise.resolve(null),
      creatorProfile: Promise.resolve(null),
    });
  }
  return requestCache.get(request)!;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // Demo mode - allow all dashboard routes
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Only run auth logic for dashboard routes
  if (!isDashboardPath(pathname)) {
    return response;
  }

  // When Supabase credentials are missing or are placeholders, skip all
  // auth/session logic so public pages render normally instead of throwing
  // (and returning 500). Auth-gated routes fall back to demo mode or a
  // login redirect handled client-side.
  if (!isSupabaseConfigured) {
    if (!isDemoMode) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get or create request-scoped cache
  const cache = getOrCreateCache(request);

  // Refresh session if expired - required for Server Components
  // Cache the session promise to avoid duplicate calls
  if (!cache.session || cache.session === Promise.resolve(null)) {
    cache.session = supabase.auth.getSession();
  }
  const { data: { session } } = await cache.session;

  // In demo mode, allow access to all dashboard routes
  if (isDemoMode) {
    return response;
  }

  // No session - redirect to login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Parallelize all profile/role queries to minimize latency
  // Cache each query promise to avoid duplicates within same request
  if (!cache.profile || cache.profile === Promise.resolve(null)) {
    cache.profile = supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle(); // Use maybeSingle to avoid error if not found
  }

  if (!cache.roles || cache.roles === Promise.resolve(null)) {
    cache.roles = supabase
      .from("profile_user_roles")
      .select(`
        role:user_roles (
          slug
        )
      `)
      .eq("profile_id", session.user.id);
  }

  if (!cache.brandMember || cache.brandMember === Promise.resolve(null)) {
    cache.brandMember = supabase
      .from("brand_members")
      .select("brand_id, role")
      .eq("profile_id", session.user.id)
      .eq("is_active", true)
      .maybeSingle();
  }

  if (!cache.creatorProfile || cache.creatorProfile === Promise.resolve(null)) {
    cache.creatorProfile = supabase
      .from("creator_profiles")
      .select("id")
      .eq("profile_id", session.user.id)
      .maybeSingle();
  }

  // Wait for all queries in parallel
  const [profileRes, rolesRes, brandMemberRes, creatorProfileRes] = await Promise.all([
    cache.profile,
    cache.roles,
    cache.brandMember,
    cache.creatorProfile,
  ]);

  const { data: profile } = profileRes;
  const { data: userRoles } = rolesRes as { data: Array<{ role: { slug: string } | null }> | null; error: any };
  const { data: brandMember } = brandMemberRes;
  const { data: creatorProfile } = creatorProfileRes;

  if (!profile) {
    return response; // Let client-side handle
  }

  const roleSlugs = userRoles?.map(ur => ur.role?.slug).filter(Boolean) || [];

  const isBrandMember = !!brandMember;
  const isCreator = !!creatorProfile;
  const isPlatformAdmin = roleSlugs.includes("platform_admin");
  const isModerator = roleSlugs.includes("moderator");
  const isStaff = roleSlugs.includes("staff");

  // Brand dashboard routes - require brand membership or platform admin
  if (pathname.startsWith("/dashboard/brand")) {
    if (!isBrandMember && !isPlatformAdmin && !isModerator && !isStaff) {
      return NextResponse.redirect(new URL("/dashboard/creator", request.url));
    }
  }

  // Creator dashboard routes - require creator profile or platform admin
  if (pathname.startsWith("/dashboard/creator")) {
    if (!isCreator && !isPlatformAdmin && !isModerator && !isStaff) {
      return NextResponse.redirect(new URL("/dashboard/brand", request.url));
    }
  }

  // Admin dashboard routes - require platform admin role
  if (pathname.startsWith("/dashboard/admin")) {
    if (!isPlatformAdmin && !isModerator && !isStaff) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Only match dashboard routes - public routes, auth routes, and API routes
     * are excluded to avoid unnecessary Supabase queries on every request.
     */
    "/dashboard/:path*",
  ],
};