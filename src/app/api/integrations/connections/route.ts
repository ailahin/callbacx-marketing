/**
 * CALLBACX — GET/DELETE /api/integrations/connections
 *
 * GET:    list the current user's provider connections with status
 *         indicators (connected / expired / error / ...). Token values are
 *         never returned.
 * DELETE: disconnect a connection (body: { connection_id }).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import {
  listMyConnections,
  disconnectConnection,
} from "@/services/integrations";
import { integrationConnectionListSchema, integrationDisconnectSchema } from "@/lib/validations";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const url = new URL(request.url);
  const input = integrationConnectionListSchema.parse({
    provider: url.searchParams.get("provider") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });

  const result = await listMyConnections(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

export const DELETE = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const body = await request.json();
  const input = integrationDisconnectSchema.parse(body);

  const result = await disconnectConnection(input.connection_id, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: { ok: true } });
});
