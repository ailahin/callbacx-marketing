/**
 * CALLBACX — POST /api/integrations/sync
 *
 * Trigger a social metrics sync for the current user's connected accounts.
 * Body: { provider?, connection_id?, metric_date? }
 *
 * Without connection_id, syncs all of the user's connected social accounts.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import {
  syncConnectionMetrics,
  syncMyConnections,
} from "@/services/integrations";
import { integrationSyncSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const input = integrationSyncSchema.parse(await request.json());

  if (input.connection_id) {
    const result = await syncConnectionMetrics(input.connection_id, supabase);
    if (result.error) throw result.error;
    return Response.json({ data: result.data });
  }

  const result = await syncMyConnections(supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});
