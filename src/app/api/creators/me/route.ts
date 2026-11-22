/**
 * CALLBACX — GET /api/creators/me
 * Current user's creator profile.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getMyCreatorProfile } from "@/services/creators";

export const GET = withErrorHandler(async (_request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const result = await getMyCreatorProfile(supabase);
  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

