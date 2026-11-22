/**
 * CALLBACX — POST /api/integrations/settings/credential
 *
 * Set (encrypt and store) a provider credential (API key, client secret,
 * webhook signing secret). Staff only.
 *
 * The value is encrypted with AES-256-GCM (INTEGRATION_VAULT_KEY) before
 * being written and is never returned in responses.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { setIntegrationCredential } from "@/services/integrations";
import { integrationCredentialSetSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const input = integrationCredentialSetSchema.parse(await request.json());

  const result = await setIntegrationCredential(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: { ok: true } }, { status: 201 });
});
