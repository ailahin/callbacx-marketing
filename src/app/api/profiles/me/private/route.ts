/**
 * CALLBACX — GET /api/profiles/me/private
 * Current user's private profile (owner only).
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getMyPrivateProfile } from "@/services/profiles";

export const GET = withErrorHandler(async (_request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const result = await getMyPrivateProfile(supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

