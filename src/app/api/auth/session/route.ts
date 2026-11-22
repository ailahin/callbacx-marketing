/**
 * CALLBACX MARKETING — GET /api/auth/session
 * Get the current session / authenticated user identity.
 */

import { withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";
import { getCurrentAuthUser, getSession } from "@/services/auth";

export const GET = withErrorHandler(async (_request: Request) => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const [sessionResult, userResult] = await Promise.all([
    getSession(supabase),
    getCurrentAuthUser(supabase),
  ]);

  if (sessionResult.error) throw sessionResult.error;
  if (userResult.error) throw userResult.error;

  return Response.json({
    data: { session: sessionResult.data, user: userResult.data },
  });
});

