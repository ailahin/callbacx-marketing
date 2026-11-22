/**
 * CALLBACX — GET/PATCH /api/integrations/settings
 *
 * GET:    list platform-wide integration provider settings (staff only).
 * PATCH:  update a provider's non-secret config / approval (staff only).
 *
 * Secrets (API keys, client secrets) are managed at
 * /api/integrations/settings/credential.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { z } from "zod";
import { listIntegrationSettings, updateIntegrationSetting } from "@/services/integrations";
import { integrationProviderSchema, integrationSettingUpdateSchema } from "@/lib/validations";

const settingsUpdateSchema = z.object({
  provider: integrationProviderSchema,
  ...integrationSettingUpdateSchema.shape,
});

export const GET = withErrorHandler(async () => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const result = await listIntegrationSettings(supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

export const PATCH = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { provider, ...patch } = settingsUpdateSchema.parse(await request.json());

  const result = await updateIntegrationSetting(provider, patch, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});
