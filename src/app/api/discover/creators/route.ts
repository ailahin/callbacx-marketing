/**
 * CALLBACX — GET /api/discover/creators
 *
 * Public creator discovery with rich filtering and pagination.
 * Cross-table filters are resolved server-side by the service layer.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { listCreators } from "@/services/creators";
import { listCreatorsSchema } from "@/lib/validations";
import { z } from "zod";

export const GET = withErrorHandler(async (request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { searchParams } = new URL(request.url);
  const raw: Record<string, unknown> = {};
  for (const [key, value] of searchParams.entries()) {
    if (raw[key] !== undefined) {
      const existing = raw[key];
      raw[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      raw[key] = value;
    }
  }

  const input = listCreatorsSchema.parse(raw);
  const result = await listCreators(input, supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});
