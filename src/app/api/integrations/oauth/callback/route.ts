/**
 * CALLBACX — GET /api/integrations/oauth/callback
 *
 * OAuth callback endpoint. Exchanges the authorization code for tokens
 * (server-to-server), encrypts and stores them, and redirects the user back
 * to the app with a connection result.
 *
 * Query: ?provider=...&code=...&state=...
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { completeOAuthFlow } from "@/services/integrations";
import { integrationOAuthCallbackSchema } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const url = new URL(request.url);
  const input = integrationOAuthCallbackSchema.parse({
    provider: url.searchParams.get("provider"),
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
  });

  const result = await completeOAuthFlow(
    { provider: input.provider, code: input.code, state: input.state },
    supabase
  );

  const base = result.redirectTo ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/creator/social`;
  const redirect = new URL(base);
  redirect.searchParams.set("connected", "1");
  redirect.searchParams.set("provider", result.provider);
  redirect.searchParams.set("connectionId", result.connectionId);

  return Response.redirect(redirect.toString());
});
