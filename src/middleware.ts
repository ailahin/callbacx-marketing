import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Route Protection Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ["/", "/login", "/signup", "/reset-password", "/auth/callback"];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  // Demo mode - allow all dashboard routes
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (isPublicRoute) {
    return response;
  }

  // Dashboard route protection
  if (pathname.startsWith("/dashboard")) {
    const { data: { session } } = await supabase.auth.getSession();

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

    // Check role-based access for brand/creator/admin routes
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      return response; // Let client-side handle
    }

    // Get user roles
    const { data: userRoles } = await supabase
      .from("profile_user_roles")
      .select(`
        role:user_roles (
          slug
        )
      `)
      .eq("profile_id", profile.id);

    const roleSlugs = userRoles?.map(ur => ur.role?.slug).filter(Boolean) || [];

    // Check brand membership
    const { data: brandMember } = await supabase
      .from("brand_members")
      .select("brand_id, role")
      .eq("profile_id", profile.id)
      .eq("is_active", true)
      .maybeSingle();

    // Check creator profile
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

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
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|public|api).*)",
  ],
};