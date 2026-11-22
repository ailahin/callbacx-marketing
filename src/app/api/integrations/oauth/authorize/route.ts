/**
 * CALLBACX — GET /api/integrations/oauth/authorize
 *
 * Starts an OAuth 2.0 flow for a social provider (Instagram, TikTok,
 * YouTube). Returns the provider authorization URL; the client redirects
 * the user there.
 *
 * Query: ?provider=instagram|tiktok|youtube&redirect_to=...
 */

import { withErrorHandler } from "@/lib/errors";
import { Errors } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getOAuthAuthorizationUrl } from "@/services/integrations";
import { integrationOAuthAuthorizeSchema } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const url = new URL(request.url);
  const input = integrationOAuthAuthorizeSchema.parse({
    provider: url.searchParams.get("provider"),
    redirect_to: url.searchParams.get("redirect_to") ?? undefined,
  });

  // Resolve the current profile from the session to bind the OAuth state.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw Errors.authSessionRequired();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile) throw Errors.profileNotFound();

  const result = await getOAuthAuthorizationUrl(
    {
      provider: input.provider,
      profileId: (profile as { id: string }).id,
      redirectTo: input.redirect_to ?? null,
    },
    supabase
  );

  return Response.json({
    data: {
      authorizationUrl: result.authorizationUrl,
      state: result.state,
      scopes: result.scopes,
      provider: result.provider,
    },
  });
});
