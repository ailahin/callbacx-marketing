/**
 * CALLBACX — GET /api/integrations/readiness
 *
 * Readiness of every integration provider (enabled, approval status,
 * missing configuration). Staff only. Used by UI connection status
 * indicators to show which integrations require credentials or approval.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getProviderReadiness } from "@/services/integrations";
import { integrationProviderSchema } from "@/lib/validations";
import { z } from "zod";

const readinessSchema = z.object({
  provider: integrationProviderSchema.optional(),
});

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { provider } = readinessSchema.parse({
    provider: request.url ? new URL(request.url).searchParams.get("provider") ?? undefined : undefined,
  });

  if (provider) {
    const result = await getProviderReadiness(provider, supabase);
    if (result.error) throw result.error;
    return Response.json({ data: [result.data] });
  }

  const { listIntegrationSettings } = await import("@/services/integrations");
  const settings = await listIntegrationSettings(supabase);
  if (settings.error) throw settings.error;
  if (!settings.data) return Response.json({ data: [] });

  const readiness = await Promise.all(
    settings.data.map((s) => getProviderReadiness(s.provider, supabase))
  );

  const results = readiness.map((r) => (r.error ? null : r.data)).filter(Boolean);
  return Response.json({ data: results });
});