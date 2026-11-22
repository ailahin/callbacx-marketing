/**
 * CALLBACX — GET /api/profiles/me
 * Current user's public profile.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getMyProfile } from "@/services/profiles";

export const GET = withErrorHandler(async (_request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const result = await getMyProfile(supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

